from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from jose import JWTError, jwt
from bson import ObjectId
from datetime import datetime
from typing import List, Optional

from config import settings
from db.mongo import get_database
from services.nlp_service import generate_flashcards

router = APIRouter()
security = HTTPBearer()


# ── Auth dependency ────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── Request / Response models ──────────────────────────────────────────────

class GenerateRequest(BaseModel):
    notes: str = Field(..., min_length=100, max_length=5000,
                       description="Study notes to convert into flashcards (100–5000 chars)")


class ReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(known|not_known)$")


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/generate", status_code=201)
async def generate_cards(req: GenerateRequest, user_id: str = Depends(get_current_user)):
    db = get_database()

    # Run NLP pipeline
    result = generate_flashcards(req.notes)
    cards_data = result["flashcards"]
    title = result["title"]

    if not cards_data:
        raise HTTPException(status_code=422, detail="Could not extract meaningful content from notes. Try longer or more detailed text.")

    # Persist flashcard set
    set_doc = {
        "user_id": ObjectId(user_id),
        "title": title,
        "raw_notes": req.notes,
        "created_at": datetime.utcnow(),
        "card_count": len(cards_data),
    }
    set_res = await db.flashcard_sets.insert_one(set_doc)
    set_id = set_res.inserted_id

    # Persist individual flashcards
    card_docs = []
    for card in cards_data:
        card_docs.append({
            "set_id": set_id,
            "user_id": ObjectId(user_id),
            "question": card["question"],
            "answer": card["answer"],
            "status": "new",
            "review_weight": 1.0,
            "last_reviewed": None,
            "review_count": 0,
        })

    if card_docs:
        await db.flashcards.insert_many(card_docs)

    # Fetch inserted cards for response
    inserted_cards = await db.flashcards.find({"set_id": set_id}).to_list(length=100)

    return {
        "set_id": str(set_id),
        "title": title,
        "flashcards": [
            {
                "id": str(c["_id"]),
                "question": c["question"],
                "answer": c["answer"],
                "status": c["status"],
                "review_weight": c["review_weight"],
            }
            for c in inserted_cards
        ],
    }


@router.get("/sets")
async def get_sets(user_id: str = Depends(get_current_user)):
    db = get_database()
    cursor = db.flashcard_sets.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    sets = await cursor.to_list(length=200)

    return {
        "sets": [
            {
                "set_id": str(s["_id"]),
                "title": s["title"],
                "card_count": s["card_count"],
                "created_at": s["created_at"].isoformat(),
            }
            for s in sets
        ]
    }


@router.get("/sets/{set_id}")
async def get_set(set_id: str, user_id: str = Depends(get_current_user)):
    db = get_database()

    try:
        oid = ObjectId(set_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid set_id")

    s = await db.flashcard_sets.find_one({"_id": oid, "user_id": ObjectId(user_id)})
    if not s:
        raise HTTPException(status_code=404, detail="Set not found")

    # Cards ordered by review_weight DESC → "not known" cards surface first
    cards = await db.flashcards.find({"set_id": oid}).sort("review_weight", -1).to_list(length=1000)

    return {
        "set_id": str(s["_id"]),
        "title": s["title"],
        "flashcards": [
            {
                "id": str(c["_id"]),
                "question": c["question"],
                "answer": c["answer"],
                "status": c["status"],
                "review_weight": c["review_weight"],
            }
            for c in cards
        ],
    }


@router.patch("/{card_id}/review")
async def review_card(
    card_id: str,
    req: ReviewRequest,
    user_id: str = Depends(get_current_user),
):
    db = get_database()

    try:
        oid = ObjectId(card_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid card_id")

    card = await db.flashcards.find_one({"_id": oid, "user_id": ObjectId(user_id)})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    weight = card.get("review_weight", 1.0)

    # Weighted Spaced-Repetition: simplified SM-2
    if req.status == "known":
        new_weight = max(0.5, weight - 0.2)
    else:  # not_known
        new_weight = min(3.0, weight + 0.5)

    await db.flashcards.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": req.status,
                "review_weight": new_weight,
                "last_reviewed": datetime.utcnow(),
            },
            "$inc": {"review_count": 1},
        },
    )

    return {"updated": True, "new_weight": new_weight}
