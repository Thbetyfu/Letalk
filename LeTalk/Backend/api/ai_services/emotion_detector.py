"""
Emotion Detection Service
Memanggil ML Emotion microservice (dari AI Affective Chatroom)
yang berjalan di port 8001.
"""
import httpx
import os
import logging

logger = logging.getLogger(__name__)

EMOTION_API_URL = os.getenv("EMOTION_API_URL", "http://localhost:8001")

NEGATIVE_EMOTIONS = {
    "anger", "annoyance", "disappointment", "disapproval",
    "disgust", "embarrassment", "fear", "grief",
    "nervousness", "remorse", "sadness"
}


async def detect_emotion(text: str) -> dict:
    """
    Kirim teks ke ML Emotion service, terima hasil emosi.
    Return: {"emotions": [...], "top_emotion": "...", "confidence": 0.95}
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{EMOTION_API_URL}/predict",
                json={"text": text}
            )
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Emotion API error: {response.status_code}")
                return _default_result()
    except Exception as e:
        logger.error(f"Emotion API connection error: {e}")
        return _default_result()


def is_negative_emotion(emotion: str) -> bool:
    """Cek apakah emosi termasuk kategori negatif."""
    return emotion.lower() in NEGATIVE_EMOTIONS


def _default_result():
    return {"emotions": [], "top_emotion": "neutral", "confidence": 0.0}
