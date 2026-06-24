from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Annotated
from bson import ObjectId


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserInDB(BaseModel):
    model_config = {"arbitrary_types_allowed": True, "populate_by_name": True}

    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "email": self.email,
            "password_hash": self.password_hash,
            "created_at": self.created_at,
        }
