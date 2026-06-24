from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class FlashcardSetCreate(BaseModel):
    notes: str = Field(..., min_length=100, max_length=5000)


class FlashcardResponse(BaseModel):
    id: str
    question: str
    answer: str
    status: str
    review_weight: float


class FlashcardSetResponse(BaseModel):
    set_id: str
    title: str
    flashcards: List[FlashcardResponse]


class SetSummaryResponse(BaseModel):
    set_id: str
    title: str
    card_count: int
    created_at: str


class ReviewRequest(BaseModel):
    status: str  # "known" or "not_known"
