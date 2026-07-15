from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.routes import chat, conversation, health, message
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import conversation as conversation_model
from app.models import message as message_model


app = FastAPI(title=settings.app_name)

Base.metadata.create_all(bind=engine)

# This project does not use Alembic yet. Keep existing local SQLite databases
# compatible when a nullable column is added to the conversations table.
if settings.database_url.startswith("sqlite"):
    conversation_columns = {
        column["name"] for column in inspect(engine).get_columns("conversations")
    }
    if "deleted_at" not in conversation_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE conversations ADD COLUMN deleted_at DATETIME")
            )
    if "context_summary" not in conversation_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE conversations ADD COLUMN context_summary VARCHAR(4000)")
            )
    if "summary_updated_at" not in conversation_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE conversations ADD COLUMN summary_updated_at DATETIME")
            )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(conversation.router, prefix="/api")
app.include_router(message.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
