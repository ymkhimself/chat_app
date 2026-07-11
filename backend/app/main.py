from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import conversation, health, message
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import conversation as conversation_model
from app.models import message as message_model


app = FastAPI(title=settings.app_name)

Base.metadata.create_all(bind=engine)

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
