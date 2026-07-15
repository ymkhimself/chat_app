from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.message import MessageRead


router = APIRouter(prefix="/conversations", tags=["messages"])


@router.get("/{conversation_id}/messages", response_model=list[MessageRead])
def list_messages(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, conversation_id)
    if conversation is None or conversation.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return db.scalars(stmt).all()
