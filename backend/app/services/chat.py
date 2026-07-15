from collections.abc import Iterator
from datetime import datetime
import logging

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.conversation import Conversation
from app.models.message import Message


logger = logging.getLogger(__name__)


def _select_recent_messages(messages: list[Message]) -> list[Message]:
    """Keep the newest messages within the configured context budget.

    The complete history stays in SQLite. This only limits what is sent to
    the model for the current request. Reserve space for the conversation
    summary even before the first summary has been created.
    """
    selected: list[Message] = []
    total_chars = 0
    recent_chars_budget = max(
        1,
        settings.chat_context_max_chars - settings.chat_summary_max_chars,
    )

    for message in reversed(messages):
        message_chars = len(message.content)
        is_first = not selected
        if (
            not is_first
            and len(selected) >= settings.chat_max_history_messages
        ):
            break
        if (
            not is_first
            and total_chars + message_chars > recent_chars_budget
        ):
            break
        selected.append(message)
        total_chars += message_chars

    selected.reverse()
    return selected


def _summarize_older_messages(
    client: OpenAI,
    conversation: Conversation,
    older_messages: list[Message],
) -> str | None:
    """Create a compact summary for messages that leave the active context."""
    if not older_messages:
        return conversation.context_summary

    previous_summary = conversation.context_summary or "(No previous summary.)"
    history = "\n\n".join(
        f"{message.role.upper()}: {message.content}"
        for message in older_messages
    )
    prompt = (
        "Create a concise factual summary of the conversation context below. "
        f"Keep it under {settings.chat_summary_max_chars} characters. "
        "Preserve the user's goals, important decisions, constraints, "
        "technical details, and unresolved questions. Do not add new facts.\n\n"
        f"Previous summary:\n{previous_summary}\n\n"
        f"Older messages to incorporate:\n{history}"
    )

    if not settings.openai_base_url and hasattr(client, "responses"):
        response = client.responses.create(
            model=settings.openai_model,
            input=prompt,
        )
        summary = getattr(response, "output_text", "")
    else:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "You summarize chat history for another assistant.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        choices = getattr(response, "choices", [])
        summary = getattr(choices[0].message, "content", "") if choices else ""

    summary = (summary or "").strip()
    return summary[: settings.chat_summary_max_chars] or conversation.context_summary


def _build_context_messages(
    db: Session,
    client: OpenAI,
    conversation: Conversation,
    messages: list[Message],
) -> tuple[list[dict[str, str]], bool]:
    recent_messages = _select_recent_messages(messages)
    older_messages = messages[: len(messages) - len(recent_messages)]
    summary_messages = older_messages
    if conversation.summary_updated_at:
        summary_messages = [
            message
            for message in older_messages
            if message.created_at > conversation.summary_updated_at
        ]
    summary_created = False

    if summary_messages:
        try:
            previous_summary = conversation.context_summary
            summary = _summarize_older_messages(
                client, conversation, summary_messages
            )
            if summary and summary != previous_summary:
                conversation.context_summary = summary
                conversation.summary_updated_at = datetime.utcnow()
                db.commit()
                summary_created = True
        except Exception:
            db.rollback()
            logger.exception(
                "Conversation summary failed: conversation_id=%s",
                conversation.id,
            )

    input_messages: list[dict[str, str]] = []
    if conversation.context_summary:
        input_messages.append(
            {
                "role": "system",
                "content": (
                    "Here is a summary of earlier conversation context. "
                    "Use it when relevant:\n\n"
                    + conversation.context_summary
                ),
            }
        )
    input_messages.extend(
        {"role": message.role, "content": message.content}
        for message in recent_messages
    )
    return input_messages, summary_created


def stream_assistant_reply(
    db: Session,
    conversation: Conversation,
) -> Iterator[str]:
    """Call Responses API and persist the completed assistant response."""
    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    ).all()
    client_options = {"api_key": settings.openai_api_key}
    if settings.openai_base_url:
        client_options["base_url"] = settings.openai_base_url
    client = OpenAI(**client_options)
    input_messages, summary_created = _build_context_messages(
        db, client, conversation, messages
    )
    logger.info(
        "Starting chat completion: conversation_id=%s model=%s messages=%s/%s context_chars=%s/%s summary_created=%s base_url=%s",
        conversation.id,
        settings.openai_model,
        len(input_messages),
        len(messages),
        sum(len(message["content"]) for message in input_messages),
        settings.chat_context_max_chars,
        summary_created,
        settings.openai_base_url or "default OpenAI endpoint",
    )
    assistant_parts: list[str] = []
    response_id: str | None = None

    # Alibaba Cloud and other OpenAI-compatible providers generally expose
    # Chat Completions. The installed SDK may also be too old to expose
    # Responses API, so use it only for the native OpenAI path when available.
    if not settings.openai_base_url and hasattr(client, "responses"):
        logger.info("Using Responses API")
        response_stream = client.responses.create(
            model=settings.openai_model,
            input=input_messages,
            stream=True,
        )
        for event in response_stream:
            event_type = getattr(event, "type", "")
            if event_type == "response.output_text.delta":
                delta = getattr(event, "delta", "")
                if delta:
                    assistant_parts.append(delta)
                    yield delta
            elif event_type == "response.completed":
                completed_response = getattr(event, "response", None)
                response_id = getattr(completed_response, "id", None)
    else:
        logger.info("Using Chat Completions API")
        completion_stream = client.chat.completions.create(
            model=settings.openai_model,
            messages=input_messages,
            stream=True,
        )
        for chunk in completion_stream:
            response_id = response_id or getattr(chunk, "id", None)
            choices = getattr(chunk, "choices", [])
            if not choices:
                continue
            delta = getattr(choices[0].delta, "content", None)
            if delta:
                assistant_parts.append(delta)
                yield delta

    assistant_content = "".join(assistant_parts)
    if assistant_content:
        db.add(
            Message(
                conversation_id=conversation.id,
                role="assistant",
                content=assistant_content,
                model=settings.openai_model,
                response_id=response_id,
            )
        )
        conversation.updated_at = datetime.utcnow()
        db.commit()
