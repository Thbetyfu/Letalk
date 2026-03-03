import urllib.request
import json
import uuid

BASE_URL = "http://localhost:8000/letalk/api"
test_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
test_pin = "1234"
token = None

def post_json(endpoint, payload, auth_token=None):
    url = f"{BASE_URL}/{endpoint}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    if auth_token:
        req.add_header("Authorization", f"Bearer {auth_token}")
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8')), response.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode('utf-8')), e.code

def get_json(endpoint, auth_token=None):
    url = f"{BASE_URL}/{endpoint}"
    req = urllib.request.Request(url, method="GET")
    if auth_token:
        req.add_header("Authorization", f"Bearer {auth_token}")
        
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8')), response.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode('utf-8')), e.code

def run_tests():
    global token
    print("--- 🚀 Starting Letalk Automated API Tests ---")

    # 1. Test Signup
    print(f"\n[1] Testing Signup with {test_email}...")
    signup_payload = {
        "name": "Test User",
        "email": test_email,
        "gender": "male",
        "pin": test_pin
    }
    resp, status = post_json("signup/", signup_payload)
    print(f"Status: {status} | Response: {resp}")
    if status != 201:
        print("❌ Signup Failed!")
        return

    # 2. Test Login
    print("\n[2] Testing Login...")
    login_payload = {
        "email": test_email,
        "pin": test_pin
    }
    resp, status = post_json("login/", login_payload)
    print(f"Status: {status} | Response: {resp}")
    
    # Note: Currently login requires user to be "paired".
    # Since this is a new user, login should yield 403 "You must pair with your partner before using chat."
    if status == 403 and "pair" in resp.get('error', '').lower():
        print("✅ Expected 403 because user is not paired yet.")
    else:
        print("⚠️ Unexpected login behavior! Expected 403 for unpaired user.")
        
    # Test Generate Pairing Code
    print("\n[3] Testing Generating Partner Code...")
    resp, status = post_json("pair-partner/", {"email": test_email})
    print(f"Status: {status} | Response: {resp}")
    if status == 200 and 'partnerCode' in resp:
        print(f"✅ Code Generated: {resp['partnerCode']}")
    else:
        print("❌ Failed to generate partner code")

    # 3. Test Forget PIN
    print("\n[4] Testing Forgot PIN...")
    resp, status = post_json("forgot-pin/", {"email": test_email})
    print(f"Status: {status} | Response: {resp}")
    if status == 200:
        print("✅ Forgot PIN email queued successfully.")
    else:
        print("❌ Forgot PIN logic failed. (Could be due to invalid SMTP config)")

    print("\n--- ✅ Automated Tests Finished ---")
    print("For full end-to-end (get-user, login successfully), you need to pair the user using another test email.")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"Test script error: {e}")
