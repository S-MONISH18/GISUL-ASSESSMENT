"""
FlashMind API — Flask Edition
Pure Python, zero compiled extensions, Python 3.14 compatible.
"""

import os
import json
import math
import re
import string
from collections import Counter
from difflib import SequenceMatcher
from datetime import datetime, timedelta, timezone
from functools import wraps
import random

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv

import nltk
from nltk import pos_tag, word_tokenize, RegexpParser, sent_tokenize

# ── Bootstrap ──────────────────────────────────────────────────────────────
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
JWT_SECRET  = os.getenv("JWT_SECRET",  "change-me-in-production")
ALGORITHM   = "HS256"
TOKEN_TTL_H = 24

# ── App & CORS ─────────────────────────────────────────────────────────────
app = Flask(__name__)

# Load allowed origins from environment variable (comma-separated), defaulting to wildcard (*)
origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]

CORS(app, origins=allowed_origins)

# ── DB ─────────────────────────────────────────────────────────────────────
client = MongoClient(MONGODB_URI)
db     = client["flashmind_db"]

# ── Password hashing ───────────────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── NLTK bootstrap ─────────────────────────────────────────────────────────
_NLTK_PKGS = [
    ("tokenizers/punkt_tab",               "punkt_tab"),
    ("tokenizers/punkt",                   "punkt"),
    ("taggers/averaged_perceptron_tagger", "averaged_perceptron_tagger"),
    ("taggers/averaged_perceptron_tagger_eng", "averaged_perceptron_tagger_eng"),
    ("corpora/stopwords",                  "stopwords"),
]

# Set a writable directory for NLTK data in serverless environments
_nltk_data_dir = "/tmp/nltk_data"
if _nltk_data_dir not in nltk.data.path:
    nltk.data.path.append(_nltk_data_dir)

for path, pkg in _NLTK_PKGS:
    try:
        nltk.data.find(path)
    except LookupError:
        try:
            nltk.download(pkg, download_dir=_nltk_data_dir, quiet=True)
        except Exception:
            nltk.download(pkg, quiet=True)

from nltk.corpus import stopwords as _sw
STOP_WORDS = set(_sw.words("english"))
_NP_GRAMMAR = r"NP: {<DT>?<JJ>*<NN.*>+}"
_NP_PARSER  = RegexpParser(_NP_GRAMMAR)


# ══════════════════════════════════════════════════════════════════════════
#  NLP SERVICE
# ══════════════════════════════════════════════════════════════════════════

def _tokenize(text: str) -> list:
    return [w.lower() for w in re.findall(r"[a-zA-Z]+", text) if w.lower() not in STOP_WORDS]

def _tfidf_scores(sentences: list) -> list:
    n = len(sentences)
    if n == 0:
        return []
    tf_docs = [Counter(_tokenize(s)) for s in sentences]
    df = Counter()
    for tf in tf_docs:
        df.update(tf.keys())
    scores = []
    for tf in tf_docs:
        total = sum(tf.values()) or 1
        score = sum(
            (c / total) * (math.log((n + 1) / (df[t] + 1)) + 1)
            for t, c in tf.items()
        )
        scores.append(score)
    return scores

def _noun_phrases(sentence: str) -> list:
    try:
        tokens = word_tokenize(sentence)
        tags   = pos_tag(tokens)
        tree   = _NP_PARSER.parse(tags)
        return [
            " ".join(w for w, _ in st.leaves()).strip()
            for st in tree.subtrees(filter=lambda t: t.label() == "NP")
            if " ".join(w for w, _ in st.leaves()).strip().lower() not in STOP_WORDS
        ]
    except Exception:
        return []

_DEF_VERBS = [" is defined as ", " refers to ", " means ", " is known as ", " are called ", " is called "]

def _extract_title(sentences: list) -> str:
    nouns = []
    for s in sentences:
        try:
            tags = pos_tag(word_tokenize(s))
            nouns += [w for w, t in tags if t.startswith("NN") and w.lower() not in STOP_WORDS and len(w) > 3]
        except Exception:
            pass
    if not nouns:
        return "Study Notes"
    return Counter(nouns).most_common(1)[0][0].title()

def generate_flashcards(notes: str) -> dict:
    raw = sent_tokenize(notes)
    sentences = [" ".join(s.split()) for s in raw if len(s.split()) >= 5]
    if not sentences:
        return {"title": "Study Notes", "flashcards": []}

    # Get a pool of high-relevance sentences (up to 20)
    pool_size = min(20, len(sentences))
    scores = _tfidf_scores(sentences)
    top_idx = sorted(range(len(sentences)), key=lambda i: scores[i], reverse=True)[:pool_size]
    
    # Shuffle and select up to 12 random sentences from the pool to vary questions
    random.shuffle(top_idx)
    selected_idx = top_idx[:min(12, len(top_idx))]
    top = [sentences[i] for i in sorted(selected_idx)]

    cards, unique = [], []
    for sent in top:
        lower_sent = sent.lower()
        
        # Strategy 1: Definition Extraction
        def_verb = next((v for v in _DEF_VERBS if v in lower_sent), None)
        if def_verb:
            idx = lower_sent.find(def_verb)
            orig_verb = sent[idx:idx+len(def_verb)]
            parts = sent.split(orig_verb, 1)
            
            term = parts[0].strip()
            # If the subject is reasonably short, treat it as a definition card
            if len(term.split()) <= 5:
                # Clean up trailing/leading punctuation
                term = term.strip(string.punctuation)
                if term:
                    q = f"What does '{term}' mean?" if "mean" in def_verb else f"What is the definition of {term}?"
                    a = f"{term} {orig_verb.strip()} {parts[1].strip()}"
                    cards.append({"question": q, "answer": a})
                    continue

        # Strategy 2: Fill-in-the-blank (Cloze Deletion)
        # If it's a complex sentence or fact, extract a key noun phrase and blank it out.
        nps = _noun_phrases(sent)
        if nps:
            # Prefer noun phrases of reasonable length, but not the entire sentence
            valid_nps = [np for np in nps if 3 < len(np) < len(sent) * 0.5]
            if not valid_nps:
                valid_nps = nps # fallback
            
            # Randomly choose one of the valid noun phrases to vary the blanked-out key
            best_np = random.choice(valid_nps)
            
            # Find exact casing in the original sentence
            idx = lower_sent.find(best_np.lower())
            if idx != -1:
                actual_np = sent[idx:idx+len(best_np)]
                # Create the question with a blank
                q = sent[:idx] + "________" + sent[idx+len(best_np):]
                
                cards.append({
                    "question": f"Fill in the blank:\n{q}",
                    "answer": actual_np
                })
                continue
                
    # Deduplicate
    for card in cards:
        # Check uniqueness by comparing answers (since cloze questions are very similar if the sentence is similar)
        if not any(SequenceMatcher(None, card["answer"].lower(), u["answer"].lower()).ratio() > 0.8 for u in unique):
            unique.append(card)

    # If we generated more than 10, trim down to best 10
    unique = unique[:10]

    return {"title": _extract_title(sentences), "flashcards": unique}


# ══════════════════════════════════════════════════════════════════════════
#  AUTH HELPERS
# ══════════════════════════════════════════════════════════════════════════

def create_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_H)
    return jwt.encode({"sub": user_id, "exp": exp}, JWT_SECRET, algorithm=ALGORITHM)

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload["sub"]
    except (JWTError, KeyError):
        return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"detail": "Missing token"}), 401
        uid = decode_token(header[7:])
        if not uid:
            return jsonify({"detail": "Invalid or expired token"}), 401
        request.user_id = uid
        return f(*args, **kwargs)
    return decorated

def oid(s: str):
    try:
        return ObjectId(s)
    except InvalidId:
        return None


# ══════════════════════════════════════════════════════════════════════════
#  ROUTES — AUTH
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/auth/signup")
def signup():
    body = request.get_json(silent=True) or {}
    email    = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if "@" not in email:
        return jsonify({"detail": "Invalid email"}), 422
    if len(password) < 8:
        return jsonify({"detail": "Password must be at least 8 characters"}), 422

    if db.users.find_one({"email": email}):
        return jsonify({"detail": "Email already registered"}), 400

    result = db.users.insert_one({
        "email": email,
        "password_hash": pwd_ctx.hash(password),
        "created_at": datetime.utcnow(),
    })
    return jsonify({"message": "User created", "user_id": str(result.inserted_id)}), 201


@app.post("/api/v1/auth/login")
def login():
    body = request.get_json(silent=True) or {}
    email    = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    user = db.users.find_one({"email": email})
    if not user or not pwd_ctx.verify(password, user["password_hash"]):
        return jsonify({"detail": "Incorrect email or password"}), 401

    return jsonify({
        "access_token": create_token(str(user["_id"])),
        "token_type": "bearer",
    })


# ══════════════════════════════════════════════════════════════════════════
#  ROUTES — FLASHCARDS
# ══════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/flashcards/generate")
@require_auth
def generate():
    body  = request.get_json(silent=True) or {}
    notes = (body.get("notes") or "").strip()

    if len(notes) < 100:
        return jsonify({"detail": "Notes must be at least 100 characters"}), 422
    if len(notes) > 10000:
        return jsonify({"detail": "Notes must be at most 10,000 characters"}), 422

    result = generate_flashcards(notes)
    cards_data = result["flashcards"]
    title      = result["title"]

    if not cards_data:
        return jsonify({"detail": "Could not extract meaningful content. Try longer or more detailed notes."}), 422

    user_oid = oid(request.user_id)

    # Save set
    set_res = db.flashcard_sets.insert_one({
        "user_id":    user_oid,
        "title":      title,
        "raw_notes":  notes,
        "created_at": datetime.utcnow(),
        "card_count": len(cards_data),
    })
    set_id = set_res.inserted_id

    # Save cards
    docs = [
        {
            "set_id":        set_id,
            "user_id":       user_oid,
            "question":      c["question"],
            "answer":        c["answer"],
            "status":        "new",
            "review_weight": 1.0,
            "last_reviewed": None,
            "review_count":  0,
        }
        for c in cards_data
    ]
    db.flashcards.insert_many(docs)

    inserted = list(db.flashcards.find({"set_id": set_id}))
    return jsonify({
        "set_id":     str(set_id),
        "title":      title,
        "flashcards": [
            {
                "id":            str(c["_id"]),
                "question":      c["question"],
                "answer":        c["answer"],
                "status":        c["status"],
                "review_weight": c["review_weight"],
            }
            for c in inserted
        ],
    }), 201


@app.get("/api/v1/flashcards/sets")
@require_auth
def get_sets():
    user_oid = oid(request.user_id)
    sets = list(db.flashcard_sets.find({"user_id": user_oid}).sort("created_at", -1))

    result = []
    for s in sets:
        sid = s["_id"]
        cards = list(db.flashcards.find({"set_id": sid}))

        # Retention = known cards / reviewed cards * 100
        reviewed = [c for c in cards if c.get("review_count", 0) > 0]
        known    = [c for c in reviewed if c.get("status") == "known"]
        retention = round((len(known) / len(reviewed) * 100)) if reviewed else 0

        # Last reviewed timestamp
        last_dates = [c["last_reviewed"] for c in cards if c.get("last_reviewed")]
        if last_dates:
            latest = max(last_dates)
            # Format as relative: today / yesterday / N days ago
            diff = (datetime.utcnow() - latest).days
            if diff == 0:
                last_reviewed = "Today"
            elif diff == 1:
                last_reviewed = "Yesterday"
            else:
                last_reviewed = f"{diff} days ago"
        else:
            last_reviewed = "Never"

        result.append({
            "set_id":       str(sid),
            "title":        s["title"],
            "card_count":   s["card_count"],
            "created_at":   s["created_at"].isoformat(),
            "retention":    retention,
            "last_reviewed": last_reviewed,
        })

    return jsonify({"sets": result})


@app.get("/api/v1/flashcards/sets/<set_id>")
@require_auth
def get_set(set_id: str):
    user_oid = oid(request.user_id)
    sid = oid(set_id)
    if not sid:
        return jsonify({"detail": "Invalid set_id"}), 400

    s = db.flashcard_sets.find_one({"_id": sid, "user_id": user_oid})
    if not s:
        return jsonify({"detail": "Set not found"}), 404

    # "Not Known" cards surface first (highest weight first)
    cards = list(db.flashcards.find({"set_id": sid}).sort("review_weight", -1))
    return jsonify({
        "set_id": str(s["_id"]),
        "title":  s["title"],
        "flashcards": [
            {
                "id":            str(c["_id"]),
                "question":      c["question"],
                "answer":        c["answer"],
                "status":        c["status"],
                "review_weight": c["review_weight"],
            }
            for c in cards
        ],
    })


@app.delete("/api/v1/flashcards/sets/<set_id>")
@require_auth
def delete_set(set_id: str):
    user_oid = oid(request.user_id)
    sid = oid(set_id)
    if not sid:
        return jsonify({"detail": "Invalid set_id"}), 400

    result = db.flashcard_sets.delete_one({"_id": sid, "user_id": user_oid})
    if result.deleted_count == 0:
        return jsonify({"detail": "Set not found"}), 404

    # Delete all associated flashcards
    db.flashcards.delete_many({"set_id": sid})
    return jsonify({"deleted": True})


@app.patch("/api/v1/flashcards/<card_id>/review")
@require_auth
def review_card(card_id: str):
    user_oid = oid(request.user_id)
    cid = oid(card_id)
    if not cid:
        return jsonify({"detail": "Invalid card_id"}), 400

    body   = request.get_json(silent=True) or {}
    status = body.get("status", "")
    if status not in ("known", "not_known"):
        return jsonify({"detail": "status must be 'known' or 'not_known'"}), 422

    card = db.flashcards.find_one({"_id": cid, "user_id": user_oid})
    if not card:
        return jsonify({"detail": "Card not found"}), 404

    w = card.get("review_weight", 1.0)
    # SM-2 simplified weighted spaced repetition
    new_weight = max(0.5, w - 0.2) if status == "known" else min(3.0, w + 0.5)

    db.flashcards.update_one(
        {"_id": cid},
        {
            "$set": {
                "status":        status,
                "review_weight": new_weight,
                "last_reviewed": datetime.utcnow(),
            },
            "$inc": {"review_count": 1},
        },
    )
    return jsonify({"updated": True, "new_weight": new_weight})


@app.delete("/api/v1/flashcards/<card_id>")
@require_auth
def delete_card(card_id: str):
    user_oid = oid(request.user_id)
    cid = oid(card_id)
    if not cid:
        return jsonify({"detail": "Invalid card_id"}), 400

    card = db.flashcards.find_one({"_id": cid, "user_id": user_oid})
    if not card:
        return jsonify({"detail": "Card not found"}), 404

    db.flashcards.delete_one({"_id": cid})
    db.flashcard_sets.update_one(
        {"_id": card["set_id"]},
        {"$inc": {"card_count": -1}}
    )
    return jsonify({"deleted": True})


@app.get("/api/v1/flashcards/stats")
@require_auth
def get_stats():
    """Return real-time dashboard stats for the logged-in user."""
    user_oid = oid(request.user_id)
    all_cards = list(db.flashcards.find({"user_id": user_oid}))

    total_cards = len(all_cards)

    # Reviewed cards (at least one review)
    reviewed = [c for c in all_cards if c.get("review_count", 0) > 0]
    known    = [c for c in reviewed if c.get("status") == "known"]
    avg_retention = round((len(known) / len(reviewed) * 100)) if reviewed else 0

    # Total reviews across all cards
    total_reviews = sum(c.get("review_count", 0) for c in all_cards)

    # Streak: consecutive days (from today backwards) where at least one review happened
    review_dates = set()
    for c in all_cards:
        lr = c.get("last_reviewed")
        if lr:
            review_dates.add(lr.date())

    streak = 0
    today = datetime.utcnow().date()
    check = today
    while check in review_dates:
        streak += 1
        check = check - timedelta(days=1)

    return jsonify({
        "total_cards":   total_cards,
        "avg_retention": avg_retention,
        "total_reviews": total_reviews,
        "streak":        streak,
    })


# ══════════════════════════════════════════════════════════════════════════
#  ENTRY
# ══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
