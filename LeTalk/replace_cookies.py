import os

def replace_in_files(directory, old_str, new_str, file_extensions):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(file_extensions):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if old_str in content:
                        new_content = content.replace(old_str, new_str)
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {filepath}")
                except Exception as e:
                    print(f"Error reading/writing {filepath}: {e}")

# Frontend cookie names
FRONTEND_DIR = r"d:\0. Kerjaan\LeTalk\LeTalk\Frontend\src"
replace_in_files(FRONTEND_DIR, "loveconnect=", "letalk=", (".tsx", ".ts", ".jsx", ".js"))

# Backend cookie/session names
BACKEND_DIR = r"d:\0. Kerjaan\LeTalk\LeTalk\Backend\api"
replace_in_files(BACKEND_DIR, "'loveconnect'", "'letalk'", (".py",))
replace_in_files(BACKEND_DIR, '"loveconnect"', '"letalk"', (".py",))
