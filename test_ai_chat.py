
import asyncio
import websockets
import json
import jwt
from datetime import datetime

# Konfigurasi pengujian
WS_URL = "ws://localhost:8000/ws/chat/TEST_PAIR_CODE/?token="
JWT_SECRET = "letalk-dev-secret" # Sesuai dengan yang ada di consumers.py
ALGORITHM = "HS256"

def generate_token(email, name):
    payload = {
        "email": email,
        "name": name,
        "exp": datetime.utcnow().timestamp() + 3600
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

async def test_ai_chat_flow():
    token = generate_token("tester@letalk.com", "Tester Adam")
    url = WS_URL + token
    
    print(f"--- MEMULAI PENGUJIAN PHASE 3 & 4 ---")
    print(f"Connecting to: {url}")
    
    try:
        async with websockets.connect(url) as websocket:
            print("✅ Status: WebSocket Connected!")
            
            # Tunggu pesan sistem "AI Mediator aktif"
            welcome_msg = await websocket.recv()
            print(f"📥 Response System: {welcome_msg}")
            
            # --- TEST PHASE 4: KIRIM PESAN TOXIC ---
            print("\n🚨 Mengirim pesan toxic untuk memicu AI Mediator...")
            toxic_payload = {
                "message": "I HATE YOU SO MUCH YOU ARE SO STUPID!!!",
                "senderName": "Tester Adam",
                "senderEmail": "tester@letalk.com",
                "type": "text"
            }
            await websocket.send(json.dumps(toxic_payload))
            
            # Baca response broadcast pesan
            response1 = await websocket.recv()
            print(f"📥 Chat Broadcast: {response1}")
            
            # Tunggu update AI (Emotion & Toxicity) - Biasanya dikirim setelah processing
            print("⏳ Menunggu AI melakukan analisis emosi & toksisitas...")
            try:
                # Kita tunggu beberapa detik karena AI bekerja asinkron
                for _ in range(3):
                    response_ai = await websocket.recv()
                    data = json.loads(response_ai)
                    if data['type'] == 'ai_update':
                        print(f"✅ AI UPDATE DETECTED: Emotion={data['emotion']}, Toxic={data['is_toxic']}, Score={data['toxicity_score']}")
                    if data['type'] == 'conflict_detected':
                        print(f"🔥 CONFLICT DETECTED: Chat room locked! Message: {data['data']['message'][:50]}...")
                        break
            except Exception as e:
                print(f"Info: {e}")

    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_ai_chat_flow())
