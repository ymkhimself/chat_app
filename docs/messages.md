# Messages Design

## Goal

The message module stores the actual chat content inside each conversation.

The conversation module answers:

```text
Which chat sessions exist?
```

The message module answers:

```text
What happened inside one chat session?
```

For the first version, messages are simple persisted records. They are not responsible for calling the LLM directly. The future chat API will create messages as part of the send-and-stream flow.

## Data Model

Create a `messages` table.

Recommended fields:

```text
id              string, primary key, UUID
conversation_id string, required, foreign key to conversations.id
role            string, required
content         text, required
model           string, optional
response_id     string, optional
created_at      datetime, required
```

The `conversations` table also stores model-facing context state:

```text
context_summary    string, optional, bounded summary of older messages
summary_updated_at datetime, optional, last summary refresh time
```

These fields do not replace message history. They let the chat service keep
the complete transcript for display and audit while sending a bounded context
to the model.

Role values for the first version:

```text
user
assistant
system
```

The first implementation only needs `user` and `assistant`. Keep `system` as an allowed value because it is common in LLM conversation history.

## Relationship

One conversation has many messages:

```text
Conversation 1 -> N Message
```

When a conversation is deleted, it should be soft-deleted by setting
`conversations.deleted_at`. The conversation and its messages remain in the
database for recovery and audit purposes, but normal list, message, and chat
queries must exclude deleted conversations.

The relationship can still use a cascade for a future hard-delete operation,
but the normal delete API must only update `deleted_at`:

```text
Conversation.deleted_at -> nullable datetime
DELETE /api/conversations/{id} -> UPDATE conversations SET deleted_at = ...
Message.conversation_id -> ForeignKey("conversations.id")
```

## Files To Add Or Update

Expected backend files:

```text
backend/app/models/message.py
backend/app/schemas/message.py
backend/app/api/routes/message.py
backend/app/main.py
backend/app/models/conversation.py
```

Optional later files:

```text
backend/app/repositories/message_repo.py
backend/app/services/message_service.py
```

For the first version, a thin route plus SQLAlchemy queries is enough.

## API

### List Messages

```text
GET /api/conversations/{conversation_id}/messages
```

Returns all messages in one conversation, ordered by creation time ascending.

Response:

```json
[
  {
    "id": "message-id",
    "conversation_id": "conversation-id",
    "role": "user",
    "content": "Hello",
    "model": null,
    "response_id": null,
    "created_at": "2026-07-08T12:00:00"
  },
  {
    "id": "message-id",
    "conversation_id": "conversation-id",
    "role": "assistant",
    "content": "Hi! How can I help?",
    "model": "gpt-4.1-mini",
    "response_id": "resp_xxx",
    "created_at": "2026-07-08T12:00:01"
  }
]
```

If the conversation does not exist, return:

```text
404 Conversation not found
```

## Should There Be A Create Message API?

Not in the first version.

Do not expose:

```text
POST /api/messages
```

The first chat app should create messages through the chat API:

```text
POST /api/chat/stream
```

That endpoint should:

```text
1. receive the user input
2. save a user message
3. generate or stream the assistant reply
4. save an assistant message
```

This keeps the frontend from manually constructing conversation history incorrectly.

## Future Chat Flow

When `POST /api/chat/stream` is implemented, it should use the message module like this:

```text
Client sends message
  -> validate conversation exists
  -> insert user message
  -> load recent conversation messages
  -> if older messages leave the context window, summarize them and save the summary
  -> send the saved summary plus recent messages to the model
  -> call LLM or fake streaming service
  -> stream assistant chunks to client
  -> insert final assistant message
  -> update conversation.updated_at
```

## First Implementation Scope

Implement only:

```text
GET /api/conversations/{conversation_id}/messages
```

Also add:

```text
Message SQLAlchemy model
Message Pydantic read schema
Conversation.messages relationship
soft delete through `deleted_at`
```

Do not add LLM calls, streaming, frontend changes, or message creation endpoints in this step.
