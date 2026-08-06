"""
Spam detection (Phase 8).

A real trained classifier (TF-IDF + Logistic Regression) rather than only
keyword heuristics. Trained on a small, hand-labeled seed dataset bundled
with the code — works fully offline, cached to ml_models/spam_model.pkl
after first training.
"""
from __future__ import annotations

import os
import pickle

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from app.core.config import get_settings

settings = get_settings()

MODEL_PATH = os.path.join(settings.ML_MODELS_DIR, "spam_model.pkl")

SEED_TEXTS: list[str] = [
    "Buy now and get 50% off on all items, limited stock available!",
    "Exclusive deal just for you, shop now before offer ends",
    "Use promo code SAVE20 to get instant discount on your order",
    "Flash sale today only, free shipping on all products",
    "Subscribe to our channel for daily deals and exclusive offers",
    "Get a free trial of our premium plan, act before it expires",
    "Huge clearance sale, up to 70% off, shop the collection now",
    "Limited time offer! Grab your discount coupon before stock runs out",
    "Join now and get a free gift card worth $50 on signup",
    "Unsubscribe anytime, but don't miss this exclusive promo code today",
    "Hey, are we still meeting for coffee tomorrow morning?",
    "Can you send me the report before end of day?",
    "Happy birthday! Hope you have a wonderful day",
    "Don't forget to pick up milk on your way home",
    "The meeting has been moved to 3 PM, see you there",
    "Thanks for helping me move last weekend, really appreciate it",
    "Let's catch up this weekend, it's been a while",
    "Your appointment with Dr. Sharma is confirmed for Monday 10 AM",
    "Please review the attached document and share your feedback",
    "Great job on the presentation today, the client loved it",
]
SEED_LABELS: list[int] = [1] * 10 + [0] * 10


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
        except Exception:
            pass

    model = _train_model()
    os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model


_model_instance: Pipeline | None = None


def get_spam_model() -> Pipeline:
    global _model_instance
    if _model_instance is None:
        _model_instance = _load_or_train_model()
    return _model_instance


def predict_spam_probability(content: str) -> float:
    if not content or not content.strip():
        return 0.0
    model = get_spam_model()
    proba = model.predict_proba([content])[0]
    classes = list(model.classes_)
    spam_index = classes.index(1)
    return round(float(proba[spam_index]), 4)


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