"""
Scam detection (Phase 9).

A trained classifier (TF-IDF + Logistic Regression), same architecture as
Phase 8's spam detector but trained on a distinct seed set focused on scam
patterns specifically: OTP/phishing requests, lottery/prize scams, bank
impersonation, tech-support scams, and romance/investment scams — as
opposed to spam's commercial-promotion patterns. Keeping scam and spam as
separate classifiers (rather than one shared model) matters because they
call for different actions: spam typically -> Mute, but a scam impersonating
a bank often needs to be flagged more assertively since the harm is direct
financial loss, not just an annoying message.

Works fully offline, cached to ml_models/scam_model.pkl after first training.
"""
from __future__ import annotations

import os
import pickle

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from app.core.config import get_settings

settings = get_settings()

MODEL_PATH = os.path.join(settings.ML_MODELS_DIR, "scam_model.pkl")

# --- Seed dataset (label: 1 = scam, 0 = not scam) ---
SEED_TEXTS: list[str] = [
    # scam
    "Your OTP is 384921, share it now to verify your bank account immediately",
    "Congratulations! You have won a lottery of $50000, click here to claim your prize",
    "Your account will be suspended, verify your details now by clicking this link",
    "This is your bank calling, we detected suspicious activity, share your PIN to secure account",
    "You have been selected for a free iPhone, pay a small shipping fee to claim it",
    "Urgent: your package is held at customs, pay the fee now to release it",
    "I am a US soldier and need your help transferring funds, please share your bank details",
    "Invest now and double your money in 24 hours guaranteed returns",
    "Your tax refund of $2000 is pending, verify your SSN to receive it",
    "Tech support alert: your computer is infected, call this number immediately for help",
    "We noticed unauthorized login to your account, confirm your password to secure it",
    "Your electricity will be disconnected today, pay immediately via this link to avoid",
    # not scam
    "Hey, are we still meeting for coffee tomorrow morning?",
    "Can you send me the report before end of day?",
    "Your order has been shipped and will arrive in 3 to 5 business days",
    "Reminder: your dentist appointment is scheduled for Monday at 10 AM",
    "Thanks for the birthday wishes, had a great day",
    "The quarterly meeting has been moved to conference room B",
    "Please find attached the invoice for last month's services",
    "Great catching up with you yesterday, let's do it again soon",
    "Your OTP for login is 293841, valid for 10 minutes",
    "Your subscription renewal was successful, thank you for being a customer",
]
SEED_LABELS: list[int] = [1] * 12 + [0] * 10


def _train_model() -> Pipeline:
    pipeline = Pipeline(
        [
            ("tfidf", TfidfVectorizer(max_features=500, ngram_range=(1, 2), min_df=1)),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )
    pipeline.fit(SEED_TEXTS, SEED_LABELS)
    return pipeline


def _load_or_train_model() -> Pipeline:
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                return pickle.load(f)
        except Exception:  # noqa: BLE001
            pass

    model = _train_model()
    os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model


_model_instance: Pipeline | None = None


def get_scam_model() -> Pipeline:
    global _model_instance
    if _model_instance is None:
        _model_instance = _load_or_train_model()
    return _model_instance


def predict_scam_probability(content: str) -> float:
    """Return P(scam) in [0, 1] for the given message text."""
    if not content or not content.strip():
        return 0.0
    model = get_scam_model()
    proba = model.predict_proba([content])[0]
    classes = list(model.classes_)
    scam_index = classes.index(1)
    return round(float(proba[scam_index]), 4)


def retrain_from_examples(texts: list[str], labels: list[int]) -> int:
    global _model_instance
    all_texts = SEED_TEXTS + texts
    all_labels = SEED_LABELS + labels

    pipeline = Pipeline(
        [
            ("tfidf", TfidfVectorizer(max_features=500, ngram_range=(1, 2), min_df=1)),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )
    pipeline.fit(all_texts, all_labels)

    os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)

    _model_instance = pipeline
    return len(all_texts)
