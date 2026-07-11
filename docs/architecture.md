# Architecture

## Overview

This project is a small full-stack AI chat application.

The app is intentionally simple:

- The React frontend renders the chat interface.
- The FastAPI backend exposes chat and conversation APIs.
- SQLite stores conversations and messages locally.
- The backend calls the OpenAI Responses API.
- Streaming responses are returned from the backend to the frontend.

The goal is to learn the core shape of an AI application before adding heavier infrastructure.

## High-Level Flow

```text
User
  -> React UI
  -> FastAPI API
  -> Chat service
  -> OpenAI Responses API
  -> FastAPI streaming response
  -> React UI renders tokens as they arrive
```

For persisted conversations:

```text
React UI
  -> FastAPI API
  -> Repository layer
  -> SQLite database
```

## Backend

The backend lives under `backend/`.

Current structure:

```text
backend/
  app/
    main.py
    api/
      routes/
    core/
    db/
    models/
    repositories/
    schemas/
    services/
  data/
```

Responsibilities:

- `main.py`: create the FastAPI app, configure middleware, register routers
- `api/routes/`: HTTP route handlers
- `core/`: settings and shared configuration
- `db/`: SQLAlchemy engine, session, and base model
- `models/`: SQLAlchemy ORM models
- `schemas/`: Pydantic schemas for requests and responses
- `repositories/`: database access helpers
- `services/`: business logic and external integrations

## Frontend

The frontend lives under `frontend/`.

Current structure:

```text
frontend/
  src/
    api/
    components/
    hooks/
    styles/
    types/
    App.tsx
    main.tsx
```

Responsibilities:

- `api/`: functions that call backend endpoints
- `components/`: chat UI and reusable UI pieces
- `hooks/`: stateful frontend logic, especially streaming chat
- `types/`: TypeScript types shared by frontend modules
- `App.tsx`: main application screen

During local development, Vite proxies `/api` requests to the FastAPI backend at `http://localhost:8000`.

## Database

The first version uses SQLite.

Local database files should live under:

```text
backend/data/
```

Expected initial tables:

- `conversations`: one row per chat session
- `messages`: one row per user or assistant message

Likely message fields:

- `id`
- `conversation_id`
- `role`
- `content`
- `model`
- `response_id`
- `created_at`

SQLite is enough for the first version. A future migration to PostgreSQL or MySQL should only happen when the app needs multi-user production scale or higher write concurrency.

## API Shape

Initial endpoints should stay small:

```text
GET    /api/health
GET    /api/conversations
GET    /api/conversations/{conversation_id}/messages
POST   /api/chat/stream
DELETE /api/conversations/{conversation_id}
```

The streaming endpoint should support sending a user message and receiving assistant output incrementally.

## Streaming

The preferred first implementation is backend-to-frontend streaming with `fetch` and `ReadableStream`.

This is usually more flexible than `EventSource` for chat because chat requests are naturally `POST` requests with a JSON body.

The backend should:

- receive the user message
- save the user message
- call the LLM provider
- stream assistant text chunks to the frontend
- save the final assistant message after completion

## Configuration

Configuration should come from environment variables.

Important variables:

```text
APP_NAME
APP_ENV
DATABASE_URL
OPENAI_API_KEY
```

Local secrets should be stored in `backend/.env`, which must not be committed.

## Non-Goals For The First Version

Do not add these unless explicitly requested:

- user login
- payment
- Redis
- MySQL or PostgreSQL
- Docker deployment
- vector database
- file upload
- RAG
- admin dashboard
- complex agent/tool orchestration

These can be added later after the basic chat loop is working.

