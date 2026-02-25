"""
AI Personality Profiler
Menggunakan Google Gemini untuk menganalisis kepribadian user
dari jawaban quiz dan pola chat.
"""
import os
import json
import logging

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


def analyze_personality(quiz_answers: dict) -> dict:
    """
    Analisis kepribadian berdasarkan jawaban quiz menggunakan Gemini.
    Return: dict personality profile
    """
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
Kamu adalah AI Personality Analyzer untuk aplikasi Letalk.
Berdasarkan jawaban quiz berikut, buatlah personality profile dalam format JSON.

Jawaban Quiz:
{json.dumps(quiz_answers, indent=2, ensure_ascii=False)}

Buatlah profile dengan fields berikut (dalam JSON):
{{
    "personality_type": "tipe kepribadian (mis: The Caregiver, The Adventurer)",
    "communication_style": "direct/indirect/assertive/passive",
    "conflict_handling": "avoidant/competitive/collaborative/compromising/accommodating",
    "love_language": "words_of_affirmation/quality_time/physical_touch/acts_of_service/gifts",
    "emotional_sensitivity": angka 1-10,
    "empathy_level": angka 1-10,
    "patience_level": angka 1-10,
    "summary": "ringkasan 2-3 kalimat bahasa Indonesia",
    "strengths": ["kekuatan 1", "kekuatan 2", "kekuatan 3"],
    "growth_areas": ["area pengembangan 1", "area pengembangan 2"]
}}

HANYA keluarkan JSON tanpa markdown atau penjelasan tambahan.
"""
        response = model.generate_content(prompt)
        text = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(text)

    except Exception as e:
        logger.error(f"Personality analysis error: {e}")
        return {
            "personality_type": "Belum dianalisis",
            "communication_style": "unknown",
            "conflict_handling": "unknown",
            "love_language": "unknown",
            "emotional_sensitivity": 5,
            "empathy_level": 5,
            "patience_level": 5,
            "summary": "Profil belum bisa dianalisis. Silakan coba lagi.",
            "strengths": [],
            "growth_areas": []
        }
