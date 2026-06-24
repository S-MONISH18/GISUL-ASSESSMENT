"""
NLP Service — FlashMind
Zero compiled dependencies — works on any Python 3.x including 3.14.

Algorithm:
  1. NLTK sentence tokenizer → split notes into sentences.
  2. Pure-Python TF-IDF → rank sentences by information density.
  3. NLTK POS tagger + noun-phrase chunker → extract the key concept per sentence.
  4. Template question generation based on sentence context clues.
  5. SequenceMatcher deduplication of generated Q&A pairs.
  6. Most-frequent noun heuristic for set title generation.
"""

import math
import re
import string
from collections import Counter
from difflib import SequenceMatcher

import nltk
from nltk import pos_tag, word_tokenize, RegexpParser, sent_tokenize


# ── Bootstrap NLTK data (downloaded once) ─────────────────────────────────

_NLTK_PKGS = [
    ("tokenizers/punkt_tab",               "punkt_tab"),
    ("tokenizers/punkt",                   "punkt"),
    ("taggers/averaged_perceptron_tagger", "averaged_perceptron_tagger"),
    ("taggers/averaged_perceptron_tagger_eng", "averaged_perceptron_tagger_eng"),
    ("corpora/stopwords",                  "stopwords"),
]

def _bootstrap_nltk():
    for path, pkg in _NLTK_PKGS:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(pkg, quiet=True)

_bootstrap_nltk()

from nltk.corpus import stopwords as _sw
STOP_WORDS: set[str] = set(_sw.words("english"))

# Grammar for NLTK noun-phrase chunker
_NP_GRAMMAR = r"NP: {<DT>?<JJ>*<NN.*>+}"
_NP_PARSER   = RegexpParser(_NP_GRAMMAR)


# ── Pure-Python TF-IDF ─────────────────────────────────────────────────────

def _tokenize(text: str) -> list[str]:
    return [w.lower() for w in re.findall(r"[a-zA-Z]+", text) if w.lower() not in STOP_WORDS]


def _tfidf_scores(sentences: list[str]) -> list[float]:
    """
    Compute a TF-IDF-based importance score for each sentence.
    Returns a list of floats, one per sentence (higher = more important).
    """
    n = len(sentences)
    if n == 0:
        return []

    # Term frequency per document
    tf_docs: list[Counter] = [Counter(_tokenize(s)) for s in sentences]

    # Document frequency
    df: Counter = Counter()
    for tf in tf_docs:
        df.update(tf.keys())

    # Score each sentence
    scores: list[float] = []
    for tf in tf_docs:
        total = sum(tf.values()) or 1
        score = 0.0
        for term, count in tf.items():
            tf_val  = count / total
            idf_val = math.log((n + 1) / (df[term] + 1)) + 1  # smoothed IDF
            score  += tf_val * idf_val
        scores.append(score)

    return scores


# ── Noun-phrase extraction ─────────────────────────────────────────────────

def _noun_phrases(sentence: str) -> list[str]:
    try:
        tokens = word_tokenize(sentence)
        tags   = pos_tag(tokens)
        tree   = _NP_PARSER.parse(tags)
        nps = []
        for subtree in tree.subtrees(filter=lambda t: t.label() == "NP"):
            phrase = " ".join(w for w, _ in subtree.leaves()).strip()
            if phrase and phrase.lower() not in STOP_WORDS:
                nps.append(phrase)
        return nps
    except Exception:
        return []


# ── Question template engine ───────────────────────────────────────────────

_DEFINE_CLUES  = {"is defined as", "refers to", "is called", "is known as", "is a type of", "means"}
_PROCESS_CLUES = {"process", "method", "technique", "procedure", "step", "mechanism"}
_FUNCTION_CLUES= {"function", "role", "purpose", "responsible", "enables", "allows"}
_CAUSE_CLUES   = {"cause", "result", "effect", "leads to", "due to", "because", "therefore"}

def _question_for(np: str, sentence: str) -> str:
    s = sentence.lower()
    if any(c in s for c in _DEFINE_CLUES):
        return f"What is the definition of {np}?"
    if any(c in s for c in _PROCESS_CLUES):
        return f"What is the process of {np}?"
    if any(c in s for c in _FUNCTION_CLUES):
        return f"What is the function of {np}?"
    if any(c in s for c in _CAUSE_CLUES):
        return f"What causes or results from {np}?"
    return f"What is {np}?"


# ── Deduplication ──────────────────────────────────────────────────────────

def _is_dup(q: str, seen: list[dict], threshold=0.75) -> bool:
    return any(SequenceMatcher(None, q.lower(), c["question"].lower()).ratio() > threshold for c in seen)


# ── Title generation ───────────────────────────────────────────────────────

def _extract_title(sentences: list[str]) -> str:
    nouns: list[str] = []
    for s in sentences:
        try:
            tags = pos_tag(word_tokenize(s))
            nouns.extend(
                w for w, t in tags
                if t.startswith("NN") and w.lower() not in STOP_WORDS and len(w) > 3
            )
        except Exception:
            pass
    if not nouns:
        return "Study Notes"
    return Counter(nouns).most_common(1)[0][0].title()


# ── Public API ─────────────────────────────────────────────────────────────

def generate_flashcards(notes: str) -> dict:
    """
    Main entry point.
    Returns {"title": str, "flashcards": [{"question": str, "answer": str}, …]}
    """
    # 1. Sentence tokenise
    raw_sents = sent_tokenize(notes)
    sentences = [" ".join(s.split()) for s in raw_sents if len(s.split()) >= 5]

    if not sentences:
        return {"title": "Study Notes", "flashcards": []}

    # 2. TF-IDF ranking → top-N sentences
    N = min(10, len(sentences))
    scores = _tfidf_scores(sentences)
    ranked_idx = sorted(range(len(sentences)), key=lambda i: scores[i], reverse=True)[:N]
    top_sentences = [sentences[i] for i in sorted(ranked_idx)]  # keep document order

    # 3–4. Noun-phrase extraction + question generation
    flashcards: list[dict] = []
    for sent in top_sentences:
        nps = _noun_phrases(sent)
        if nps:
            # Prefer the longest / most descriptive NP
            best = max(nps, key=len)
        else:
            # Fallback: first 3 non-stop content words
            words = [w for w in word_tokenize(sent)
                     if w.isalpha() and w.lower() not in STOP_WORDS]
            if not words:
                continue
            best = " ".join(words[:3])

        question = _question_for(best, sent)
        answer   = sent
        flashcards.append({"question": question, "answer": answer})

    # 5. Deduplication
    unique: list[dict] = []
    for card in flashcards:
        if not _is_dup(card["question"], unique):
            unique.append(card)

    # 6. Title
    title = _extract_title(sentences)

    return {"title": title, "flashcards": unique}
