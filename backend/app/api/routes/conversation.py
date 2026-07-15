from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationRead, ConversationUpdate


router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationRead])
def list_conversations(db: Session = Depends(get_db)):
    stmt = (
        select(Conversation)
        .where(Conversation.deleted_at.is_(None))
        .order_by(Conversation.updated_at.desc())
    )
    return db.scalars(stmt).all()


@router.post(
    "",
    response_model=ConversationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    payload: ConversationCreate | None = None,
    db: Session = Depends(get_db),
):
    conversation = Conversation(
        title=payload.title if payload else "New conversation",
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.patch("/{conversation_id}", response_model=ConversationRead)
def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    db: Session = Depends(get_db),
):
    conversation = db.get(Conversation, conversation_id)
    if conversation is None or conversation.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    conversation.title = payload.title.strip()
    if not conversation.title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Conversation title cannot be empty.",
        )
    db.commit()
    db.refresh(conversation)
    return conversation


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, conversation_id)
    if conversation is None or conversation.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    conversation.deleted_at = datetime.utcnow()
    db.commit()
    return None
