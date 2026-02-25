"""
Toxicity Detection Service
Memanggil ML Toxicity microservice (dari AI Affective Chatroom)
yang berjalan di port 8002.
"""
import httpx
import os
import logging

logger = logging.getLogger(__name__)

TOXICITY_API_URL = os.getenv("TOXICITY_API_URL", "http://localhost:8002")
TOXICITY_THRESHOLD = 0.7


async def check_toxicity(text: str) -> dict:
    """
    Kirim teks ke ML Toxicity service, terima hasil analisis.
    Return: {"is_toxic": bool, "toxicity_score": 0.1, "label": "toxic/neutral"}
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{TOXICITY_API_URL}/predict",
                json={"text": text}
            )
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Toxicity API error: {response.status_code}")
                return _default_result()
    except Exception as e:
        logger.error(f"Toxicity API connection error: {e}")
        return _default_result()


def is_above_threshold(result: dict) -> bool:
    """Cek apakah skor toxicity melewati batas konflik."""
    return result.get("toxicity_score", 0.0) > TOXICITY_THRESHOLD


def _default_result():
    return {"is_toxic": False, "toxicity_score": 0.0, "label": "neutral"}
