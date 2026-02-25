"""
AI Mediator Service
Memantau percakapan, menggabungkan data personality kedua user,
memberikan judgment & saran rekonsiliasi.
"""
import os
import json
import logging

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


class AIMediatorService:
    """AI yang memantau percakapan dan memediasi pasangan."""

    def analyze_conversation(self, recent_messages: list,
                              profile_a: dict, profile_b: dict) -> dict:
        """Analisis percakapan berdasarkan profil kedua user."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=GOOGLE_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
Kamu adalah AI Mediator di aplikasi Letalk.
Analisis percakapan berikut berdasarkan profil kepribadian kedua user.

Profil User A: {json.dumps(profile_a, ensure_ascii=False)}
Profil User B: {json.dumps(profile_b, ensure_ascii=False)}

Percakapan terbaru:
{json.dumps(recent_messages[-20:], ensure_ascii=False)}

Berikan analisis dalam format JSON:
{{
    "conversation_health": angka 1-10,
    "potential_issues": ["isu 1", "isu 2"],
    "positive_signs": ["tanda positif 1"],
    "tip_for_a": "saran untuk User A",
    "tip_for_b": "saran untuk User B",
    "overall_mood": "happy/neutral/tense/heated"
}}

HANYA keluarkan JSON.
"""
            response = model.generate_content(prompt)
            text = response.text.strip().replace("```json", "").replace("```", "")
            return json.loads(text)

        except Exception as e:
            logger.error(f"Conversation analysis error: {e}")
            return {
                "conversation_health": 5,
                "potential_issues": [],
                "positive_signs": [],
                "tip_for_a": "", "tip_for_b": "",
                "overall_mood": "neutral"
            }

    def generate_judgment(self, conflict_context: dict) -> dict:
        """Generate judgment yang jujur tentang siapa yang salah."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=GOOGLE_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
Kamu adalah AI Judge yang TEGAS di aplikasi Letalk.
Berdasarkan konteks konflik, berikan judgment jujur.

Konteks: {json.dumps(conflict_context, ensure_ascii=False)}

Format JSON:
{{
    "summary": "ringkasan apa yang terjadi",
    "fault_analysis": "siapa yang lebih salah dan kenapa",
    "user_a_mistakes": ["kesalahan A1"],
    "user_b_mistakes": ["kesalahan B1"],
    "severity": "low/medium/high",
    "root_cause": "akar masalah"
}}

HANYA JSON. Jangan takut jujur.
"""
            response = model.generate_content(prompt)
            text = response.text.strip().replace("```json", "").replace("```", "")
            return json.loads(text)

        except Exception as e:
            logger.error(f"Judgment error: {e}")
            return {
                "summary": "Terjadi konflik.",
                "fault_analysis": "Kedua pihak perlu introspeksi.",
                "user_a_mistakes": [], "user_b_mistakes": [],
                "severity": "medium", "root_cause": "Miskomunikasi"
            }

    def suggest_reconciliation(self, context: dict) -> dict:
        """Saran rekonsiliasi setelah cooldown selesai."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=GOOGLE_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
Kamu adalah AI Mediator yang membantu pasangan balikan setelah bertengkar.
Ego mereka sudah turun setelah 5 menit merenung.

Konteks: {json.dumps(context, ensure_ascii=False)}

Format JSON:
{{
    "opening_message": "pesan pembuka AI ke chat room",
    "suggestion_for_a": "apa yang harus dilakukan User A",
    "suggestion_for_b": "apa yang harus dilakukan User B",
    "conversation_starter": "kalimat pembuka untuk bicara baik-baik",
    "reminder": "pengingat kenapa mereka bersama"
}}

HANYA JSON. Bahasa Indonesia yang hangat.
"""
            response = model.generate_content(prompt)
            text = response.text.strip().replace("```json", "").replace("```", "")
            return json.loads(text)

        except Exception as e:
            logger.error(f"Reconciliation error: {e}")
            return {
                "opening_message": "Chat dibuka kembali. Semoga kalian sudah lebih tenang.",
                "suggestion_for_a": "Mulai dengan kata maaf yang tulus.",
                "suggestion_for_b": "Dengarkan dengan hati terbuka.",
                "conversation_starter": "Aku minta maaf soal tadi.",
                "reminder": "Kalian bersama karena saling menyayangi."
            }


# Singleton
ai_mediator = AIMediatorService()
