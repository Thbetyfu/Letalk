import os

# Directory to search
FRONTEND_DIR = r"d:\0. Kerjaan\LeTalk\LeTalk\Frontend\src"

for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith((".tsx", ".ts", ".jsx", ".js")):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content.replace("loveconnect/api/", "letalk/api/")
            
            # Rebranding generic texts
            new_content = new_content.replace("LoveConnect", "Letalk")

            # Basic color replacements for the ones requested
            new_content = new_content.replace("pink-600", "violet-600")
            new_content = new_content.replace("pink-700", "violet-700")
            new_content = new_content.replace("pink-500", "violet-500")
            new_content = new_content.replace("pink-300", "violet-300")
            new_content = new_content.replace("from-pink-100", "from-slate-100")
            new_content = new_content.replace("via-pink-50", "via-violet-50")
            new_content = new_content.replace("to-purple-100", "to-indigo-100")

            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
