from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class MessageRead(BaseModel):
    id: str
    conversation_id: str
    role: Literal["user", "assistant", "system"]
    content: str
    model: str | None = None
    response_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
