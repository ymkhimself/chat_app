from collections.abc import Iterator
from datetime import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import ChatStreamRequest
from app.services.chat import stream_assistant_reply


router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


def _stream_with_error(
    db: Session,
    conversation: Conversation,
) -> Iterator[str]:
    try:
        yield from stream_assistant_reply(db, conversation)
    except Exception:
        db.rollback()
        logger.exception(
            "Chat stream failed: conversation_id=%s model=%s base_url=%s",
            conversation.id,
            settings.openai_model,
            settings.openai_base_url or "default OpenAI endpoint",
        )
        # The HTTP headers have already been sent once streaming starts. Keep
        # the error readable in the chat instead of exposing provider details.
        yield "\n\nSorry, I couldn't complete that response. Please try again."


@router.post("/stream")
def stream_chat(
    payload: ChatStreamRequest,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API key is not configured.",
        )

    conversation = (
        db.get(Conversation, payload.conversation_id)
        if payload.conversation_id
        else None
    )
    if (
        payload.conversation_id
        and (conversation is None or conversation.deleted_at is not None)
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )
    if conversation is None:
        conversation = Conversation(title=payload.message[:60])
        db.add(conversation)
        db.flush()

    db.add(
        Message(
            conversation_id=conversation.id,
            role="user",
            content=payload.message.strip(),
        )
    )
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conversation)

    return StreamingResponse(
        _stream_with_error(db, conversation),
        media_type="text/plain; charset=utf-8",
        headers={"X-Conversation-Id": conversation.id},
    )
