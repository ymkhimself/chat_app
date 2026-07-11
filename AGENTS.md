# AGENTS.md

## Project Goal

This is a small AI chat web application for learning AI app development.

The first milestone is a local full-stack app with:

- FastAPI backend
- React frontend
- SQLite storage
- OpenAI-powered chat
- Streaming responses
- Multi-turn conversations

Keep the project simple, readable, and beginner-friendly.

## Tech Stack

- Backend: Python + FastAPI
- Frontend: React + TypeScript + Vite
- Database: SQLite
- ORM: SQLAlchemy
- LLM API: OpenAI Responses API

Do not replace FastAPI, React, Vite, SQLite, or SQLAlchemy unless the user explicitly asks.

## Repository Layout

- `backend/`: FastAPI application
- `backend/app/main.py`: FastAPI app entry point
- `backend/app/api/routes/`: API routes
- `backend/app/core/`: configuration and shared app settings
- `backend/app/db/`: database engine, session, and base model
- `backend/app/models/`: SQLAlchemy ORM models
- `backend/app/schemas/`: Pydantic request and response schemas
- `backend/app/services/`: business logic and external API integrations
- `backend/app/repositories/`: database access helpers
- `backend/data/`: local SQLite database files
- `frontend/`: React application
- `frontend/src/api/`: frontend API clients
- `frontend/src/components/`: reusable UI components
- `frontend/src/hooks/`: React hooks, including streaming chat logic
- `frontend/src/types/`: shared frontend TypeScript types
- `docs/`: project documentation

## Development Rules

- Prefer small, focused changes.
- Keep backend and frontend concerns separated.
- Avoid adding heavy frameworks or infrastructure for the first version.
- Do not introduce Docker, Redis, MySQL, PostgreSQL, authentication, or Alembic unless asked.
- Do not commit secrets, `.env` files, virtual environments, `node_modules`, or SQLite database files.
- Keep local SQLite files under `backend/data/`.
- Use environment variables for secrets and provider configuration.
- Preserve existing files and user changes. Do not revert unrelated edits.

## Backend Guidelines

- Add API endpoints under `backend/app/api/routes/`.
- Put OpenAI API code in `backend/app/services/`.
- Put database models in `backend/app/models/`.
- Put Pydantic schemas in `backend/app/schemas/`.
- Put direct database query helpers in `backend/app/repositories/`.
- Keep route handlers thin when logic grows.
- Use dependency injection for database sessions.
- For the first version, prefer explicit and readable code over deep abstractions.

## Frontend Guidelines

- Use React function components and TypeScript.
- Keep API calls under `frontend/src/api/`.
- Keep reusable UI under `frontend/src/components/`.
- Keep streaming logic in a hook, such as `frontend/src/hooks/useChatStream.ts`.
- Use the Vite proxy for backend API calls during local development.
- Build the actual chat UI as the main screen; do not create a marketing landing page.

## Local Commands

Backend:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

## Verification

When changing backend Python code, run this when dependencies are installed:

```bash
cd backend
python -m compileall app
```

When changing frontend TypeScript or React code, run this when dependencies are installed:

```bash
cd frontend
npm run build
```

If a command cannot be run because dependencies are not installed or network access is unavailable, say so clearly in the final response.

