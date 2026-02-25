"""
Conflict Manager
Mendeteksi konflik, mengelola cooldown 5 menit, dan generate refleksi AI.
Ini adalah INTI dari fitur anti-pertengkaran Letalk.
"""
import os
import json
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Pengaturan konflik
TOXICITY_THRESHOLD = 0.7
NEGATIVE_EMOTION_COUNT_THRESHOLD = 3
RECENT_MESSAGE_WINDOW = 5
COOLDOWN_DURATION_MINUTES = 5


class ConflictManager:
    """Mengelola deteksi konflik, cooldown, dan refleksi AI."""

    def __init__(self):
        # Menyimpan cooldown aktif per room: {room_id: cooldown_info}
        self.active_cooldowns = {}

    # ========== DETEKSI KONFLIK ==========

    def detect_conflict(self, recent_messages: list) -> bool:
        """
        Deteksi apakah ada konflik berdasarkan pesan terakhir.
        TRIGGER jika:
        - Ada pesan dengan toxicity_score > 0.7
        - ATAU lebih dari 3 emosi negatif dalam 5 pesan terakhir
        """
        if not recent_messages:
            return False

        window = recent_messages[-RECENT_MESSAGE_WINDOW:]

        # Cek 1: Apakah ada pesan toxic?
        for msg in window:
            score = msg.get("toxicity_score", 0)
            if isinstance(score, (int, float)) and score > TOXICITY_THRESHOLD:
                logger.info(f"Konflik terdeteksi: toxicity score {score}")
                return True

        # Cek 2: Apakah banyak emosi negatif?
        from .emotion_detector import is_negative_emotion
        negative_count = sum(
            1 for msg in window
            if is_negative_emotion(msg.get("top_emotion", "neutral"))
        )

        if negative_count >= NEGATIVE_EMOTION_COUNT_THRESHOLD:
            logger.info(f"Konflik terdeteksi: {negative_count} emosi negatif")
            return True

        return False

    # ========== COOLDOWN ==========

    def start_cooldown(self, room_id: str) -> dict:
        """Mulai cooldown 5 menit untuk sebuah chat room."""
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=COOLDOWN_DURATION_MINUTES)

        self.active_cooldowns[room_id] = {
            "started_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "is_active": True
        }
        return self.active_cooldowns[room_id]

    def is_in_cooldown(self, room_id: str) -> bool:
        """Cek apakah room sedang dalam cooldown."""
        if room_id not in self.active_cooldowns:
            return False

        cooldown = self.active_cooldowns[room_id]
        if not cooldown["is_active"]:
            return False

        expires_at = datetime.fromisoformat(cooldown["expires_at"])
        if datetime.utcnow() >= expires_at:
            cooldown["is_active"] = False
            return False

        return True

    def get_remaining_seconds(self, room_id: str) -> int:
        """Sisa waktu cooldown dalam detik."""
        if room_id not in self.active_cooldowns:
            return 0

        expires_at = datetime.fromisoformat(
            self.active_cooldowns[room_id]["expires_at"]
        )
        remaining = (expires_at - datetime.utcnow()).total_seconds()
        return max(0, int(remaining))

    # ========== REFLEKSI AI ==========

    def generate_reflection(self, user_name: str, user_profile: dict,
                            conflict_messages: list, role: str = "sender") -> str:
        """
        Generate refleksi AI yang TEGAS untuk user selama cooldown.
        AI akan langsung judge perilaku user (sesuai permintaan).
        """
        try:
            import google.generativeai as genai
            genai.configure(api_key=GOOGLE_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")

            role_desc = "yang memulai/mengirim pesan toxic" if role == "sender" else "yang merespon/terprovokasi"

            prompt = f"""
Kamu adalah AI Mediator di aplikasi Letalk. Kamu HARUS tegas dan jujur.
Kamu sedang memberikan refleksi kepada {user_name} yang baru saja bertengkar.

Profil kepribadian {user_name}: {json.dumps(user_profile, ensure_ascii=False)}

Pesan-pesan yang menyebabkan konflik:
{json.dumps(conflict_messages, ensure_ascii=False)}

Peran {user_name}: {role_desc}

TUGAS:
1. Jelaskan dengan TEGAS apa kesalahan {user_name}
2. Jangan lembut — langsung judge perilakunya
3. Jelaskan KENAPA perilaku itu salah
4. Berikan 2-3 langkah KONKRET untuk memperbaiki
5. Ingatkan tentang perasaan pasangannya

Bahasa Indonesia yang tegas tapi bermartabat. Maksimal 200 kata.
"""
            response = model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.error(f"Reflection generation error: {e}")
            return (
                f"{user_name}, chat dihentikan sementara karena terdeteksi konflik. "
                f"Gunakan waktu ini untuk merenung. "
                f"Tanyakan: apakah kata-kataku tadi membangun atau menyakiti?"
            )


# Singleton — satu instance untuk seluruh app
conflict_manager = ConflictManager()
