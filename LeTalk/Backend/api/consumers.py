"""
Letalk Chat WebSocket Consumer
Base: LoveConnect ChatConsumer
Tambahan: AI Emotion Detection, Toxicity Checking, Conflict Management
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from jwt import decode, InvalidTokenError
from datetime import datetime
from asgiref.sync import sync_to_async
from pymongo import MongoClient
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# MongoDB Connection
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['Letalk']
users_collection = db['users']

JWT_SECRET = os.getenv('JWT_SECRET', 'letalk-dev-secret')
JWT_ALGORITHM = 'HS256'


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.pair_code = self.scope['url_route']['kwargs']['pair_code']
        self.user_email = None
        self.user_name = None
        self.recent_messages = await self._load_recent_messages_for_ai()  # <-- BARU: Load dari MongoDB

        # Extract token dari query string (sama seperti LoveConnect)
        query_string = self.scope['query_string'].decode()
        token = parse_qs(query_string).get('token', [None])[0]

        try:
            payload = decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            self.user_email = payload.get('email')
            self.user_name = payload.get('name', 'Anonymous')
        except InvalidTokenError:
            await self.close()
            return

        self.room_group_name = f"chat_{self.pair_code}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Kirim pesan sebelumnya (dari LoveConnect)
        await self.send_previous_messages()

        # BARU: Kirim notifikasi AI Mediator aktif
        await self.send(text_data=json.dumps({
            "type": "system",
            "message": "🤖 AI Mediator Letalk aktif dan memantau percakapan ini.",
            "timestamp": datetime.utcnow().isoformat()
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type", "message")

        # Handle mark_seen
        if msg_type == "mark_seen":
            await self._mark_messages_seen()
            return

        # Handle ping/keepalive
        if msg_type == "ping":
            await self.send(text_data=json.dumps({"type": "pong"}))
            return

        # Handle pesan biasa
        message_text = data.get("message", "")
        # Gunakan type dari payload jika ada, default 'text'
        sub_type = data.get("type", "text")

        if not message_text.strip():
            return  # Abaikan pesan kosong

        sender_name = data.get("senderName", self.user_name)
        sender_email = data.get("senderEmail", self.user_email)

        # --- BARU: Cek apakah room sedang cooldown ---
        from .ai_services.conflict_manager import conflict_manager
        if conflict_manager.is_in_cooldown(self.pair_code):
            remaining = conflict_manager.get_remaining_seconds(self.pair_code)
            await self.send(text_data=json.dumps({
                "type": "cooldown_active",
                "message": f"⏳ Chat masih terkunci. Sisa waktu: {remaining} detik.",
                "remaining_seconds": remaining
            }))
            return

        # --- LANGKAH 1: Simpan & Broadcast pesan (INSTANT, sama seperti LoveConnect) ---
        msg_data = {
            "senderName": sender_name,
            "senderEmail": sender_email,
            "message": message_text,
            "type": sub_type, # <--- SIMPAN TIPE PESAN
            "timestamp": datetime.utcnow().isoformat(),
            "seen": False,
            # Field AI baru (diisi nanti)
            "emotion": None,
            "toxicity_score": None,
        }

        # Simpan ke MongoDB (sama seperti LoveConnect)
        await sync_to_async(self._save_message)(msg_data)

        # Broadcast ke semua user di room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": msg_data
            }
        )

        # --- LANGKAH 2: AI Processing (hanya untuk teks) ---
        if sub_type == "text":
            try:
                await self._process_ai(message_text, sender_name, msg_data)
            except Exception as e:
                logger.error(f"AI processing error: {e}")

    # =====================================================
    # AI PROCESSING — INI BAGIAN BARU DARI LETALK
    # =====================================================

    async def _process_ai(self, text: str, sender: str, msg_data: dict):
        """Proses AI: emotion detection → toxicity check → conflict detection."""

        from .ai_services.emotion_detector import detect_emotion, is_negative_emotion
        from .ai_services.toxicity_checker import check_toxicity
        from .ai_services.conflict_manager import conflict_manager

        # Panggil emotion detection
        emotion_result = await detect_emotion(text)
        top_emotion = emotion_result.get("top_emotion", "neutral")

        # Panggil toxicity detection
        toxicity_result = await check_toxicity(text)
        toxicity_score = toxicity_result.get("toxicity_score", 0)

        # Kirim AI update ke semua user
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "ai_update",
                "sender": sender,
                "emotion": top_emotion,
                "toxicity_score": toxicity_score,
                "is_toxic": toxicity_result.get("is_toxic", False),
            }
        )

        # Track pesan untuk conflict detection
        self.recent_messages.append({
            "sender": sender,
            "message": text,
            "top_emotion": top_emotion,
            "toxicity_score": toxicity_score,
            "timestamp": datetime.utcnow().isoformat()
        })
        # Simpan max 10 pesan terakhir
        self.recent_messages = self.recent_messages[-10:]

        # Update field emotion & toxicity pada pesan yang sudah tersimpan
        await self._update_message_ai_data(
            timestamp=msg_data["timestamp"],
            emotion=top_emotion,
            toxicity_score=toxicity_score
        )

        # --- CEK KONFLIK ---
        if conflict_manager.detect_conflict(self.recent_messages):
            await self._handle_conflict(sender)

    async def _handle_conflict(self, trigger_sender: str):
        """Tangani konflik: kunci chat, kirim refleksi AI."""
        from .ai_services.conflict_manager import conflict_manager

        # Jangan trigger ulang kalau sudah cooldown
        if conflict_manager.is_in_cooldown(self.pair_code):
            return

        # Mulai cooldown 5 menit
        cooldown_info = conflict_manager.start_cooldown(self.pair_code)

        # Beritahu seluruh room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "conflict_detected",
                "data": {
                    "message": (
                        "🚨 AI MEDIATOR: Konflik terdeteksi!\n\n"
                        "Chat DIKUNCI selama 5 menit.\n"
                        "Gunakan waktu ini untuk merenung.\n"
                        "AI akan memberikan refleksi kepada masing-masing pihak.\n\n"
                        "Tarik napas dalam-dalam. Ingat, kalian satu tim. 💙"
                    ),
                    "cooldown_seconds": 300,
                    "started_at": cooldown_info["started_at"],
                    "expires_at": cooldown_info["expires_at"],
                }
            }
        )

        # Generate refleksi AI (untuk pengirim pesan toxic)
        reflection = conflict_manager.generate_reflection(
            user_name=trigger_sender,
            user_profile={},
            conflict_messages=self.recent_messages[-5:],
            role="sender"
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "ai_reflection",
                "data": {
                    "from": "AI Mediator",
                    "message": reflection,
                }
            }
        )

    # =====================================================
    # HELPER FUNCTIONS — dari LoveConnect (tetap sama)
    # =====================================================

    def _save_message(self, msg_data):
        """Simpan pesan ke MongoDB (sync, dipanggil via sync_to_async)."""
        db['conversations'].update_one(
            {"pairCode": self.pair_code},
            {
                "$push": {"messages": msg_data},
                "$set": {"lastMessageAt": msg_data["timestamp"]}
            },
            upsert=True
        )

    async def _update_message_ai_data(self, timestamp: str, emotion: str, toxicity_score: float):
        """Update field emotion & toxicity pada pesan yang sudah tersimpan."""
        await sync_to_async(
            db['conversations'].update_one
        )(
            {
                "pairCode": self.pair_code,
                "messages.timestamp": timestamp
            },
            {
                "$set": {
                    "messages.$.emotion": emotion,
                    "messages.$.toxicity_score": toxicity_score,
                }
            }
        )

    async def _mark_messages_seen(self):
        """Tandai semua pesan sebagai seen."""
        await sync_to_async(
            db['conversations'].update_one
        )(
            {"pairCode": self.pair_code},
            {"$set": {"messages.$[elem].seen": True}},
            array_filters=[{"elem.senderEmail": {"$ne": self.user_email}}]
        )
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "seen_update",
                "message_id": "all",
                "seen": True
            }
        )

    async def _load_recent_messages_for_ai(self) -> list:
        """Load 10 pesan terakhir dari MongoDB untuk seed AI tracker."""
        conversation = await sync_to_async(
            db['conversations'].find_one
        )({"pairCode": self.pair_code})

        if not conversation or "messages" not in conversation:
            return []

        recent = conversation["messages"][-10:]
        return [
            {
                "sender": msg.get("senderName", ""),
                "message": msg.get("message", ""),
                "top_emotion": msg.get("emotion") or "neutral",
                "toxicity_score": msg.get("toxicity_score") or 0,
                "timestamp": msg.get("timestamp", ""),
            }
            for msg in recent
        ]

    async def send_previous_messages(self):
        """Kirim pesan-pesan sebelumnya saat user connect."""
        conversation = await sync_to_async(
            db['conversations'].find_one
        )({"pairCode": self.pair_code})

        if conversation and "messages" in conversation:
            for msg in conversation["messages"][-50:]:
                await self.send(text_data=json.dumps({
                    "type": "chat_message",
                    "message": {
                        "senderName": msg.get("senderName", ""),
                        "senderEmail": msg.get("senderEmail", ""),
                        "message": msg.get("message", ""),
                        "timestamp": msg.get("timestamp", ""),
                        "seen": msg.get("seen", False),
                        "emotion": msg.get("emotion"),
                        "toxicity_score": msg.get("toxicity_score"),
                    }
                }))

    # =====================================================
    # CHANNEL LAYER HANDLERS
    # =====================================================

    async def chat_message(self, event):
        """Handler: pesan chat biasa."""
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"]
        }))

    async def ai_update(self, event):
        """Handler: update hasil AI (emotion + toxicity)."""
        await self.send(text_data=json.dumps({
            "type": "ai_update",
            "sender": event["sender"],
            "emotion": event["emotion"],
            "toxicity_score": event["toxicity_score"],
            "is_toxic": event["is_toxic"],
        }))

    async def conflict_detected(self, event):
        """Handler: notifikasi konflik terdeteksi."""
        await self.send(text_data=json.dumps({
            "type": "conflict_detected",
            "data": event["data"]
        }))

    async def ai_reflection(self, event):
        """Handler: refleksi AI untuk user."""
        await self.send(text_data=json.dumps({
            "type": "ai_reflection",
            "data": event["data"]
        }))

    async def seen_update(self, event):
        """Handler: update status seen (dari LoveConnect)."""
        await self.send(text_data=json.dumps({
            "type": "seen_update",
            "message_id": event["message_id"],
            "seen": event["seen"]
        }))

    async def reminder_alert(self, event):
        """Handler: reminder alert dari scheduler."""
        await self.send(text_data=json.dumps({
            "type": "reminder_alert",
            "reminder": event["reminder"]
        }))