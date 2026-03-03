import os
import re

BACKEND_DIR = r"d:\0. Kerjaan\LeTalk\LeTalk\Backend\api"

def update_files():
    for root, _, files in os.walk(BACKEND_DIR):
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    new_content = content
                    
                    # 1. Update JWT_SECRET assignment
                    new_content = new_content.replace(
                        "JWT_SECRET = 'letalk'",
                        "JWT_SECRET = os.getenv('JWT_SECRET', 'letalk-dev-secret')"
                    )
                    
                    # 2. Add import os if not present and we used os.getenv
                    if "os.getenv('JWT_SECRET'" in new_content and "import os" not in new_content:
                        new_content = "import os\n" + new_content
                        
                    # 3. Update jwt.decode in gallery.py or others
                    new_content = new_content.replace(
                        'jwt.decode(token, "letalk"',
                        "jwt.decode(token, os.getenv('JWT_SECRET', 'letalk-dev-secret')"
                    )
                    new_content = new_content.replace(
                        "jwt.decode(token, 'letalk'",
                        "jwt.decode(token, os.getenv('JWT_SECRET', 'letalk-dev-secret')"
                    )
                    
                    # 4. Update MongoDB database name
                    new_content = new_content.replace(
                        "client['LoveConnect']",
                        "client['Letalk']"
                    )
                    
                    # 5. Update Email Template variables
                    new_content = new_content.replace("LOVE_CONNECT_EMAIL", "LETALK_EMAIL")
                    new_content = new_content.replace("LOVE_CONNECT_EMAIL_PASSWORD", "LETALK_EMAIL_PASSWORD")
                    new_content = new_content.replace("LoveConnect PIN Reset Code", "Letalk PIN Reset Code")
                    new_content = new_content.replace("support@loveconnect.com", "support@letalk.com")
                    new_content = new_content.replace("LoveConnect Support Request from", "Letalk Support Request from")
                    new_content = new_content.replace("The LoveConnect Team", "The Letalk Team")
                    new_content = new_content.replace(">LoveConnect<", ">Letalk<")
                    
                    # Some color replacements for the emails
                    new_content = new_content.replace("#d72660", "#7c3aed") # Title color
                    new_content = new_content.replace("#fff0f6", "#f5f3ff") # bg color
                    new_content = new_content.replace("#e11d4822", "#7c3aed22") # shadow
                    new_content = new_content.replace("#b91c4b", "#6d28d9") # text param color
                    new_content = new_content.replace("#f9a8d4", "#c4b5fd") # hr and box bg
                    new_content = new_content.replace("#fdf2f8", "#ede9fe") # other box bg
                    
                    # For verify_reset_pin magic text
                    new_content = new_content.replace("A little love, a little magic ✨", "Chat lebih cerdas, konflik lebih jarang ✨")

                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {filepath}")
                except Exception as e:
                    print(f"Error {filepath}: {e}")

if __name__ == "__main__":
    update_files()
