import os
import re

SRC_DIR = r"d:\0. Kerjaan\LeTalk\LeTalk\Frontend\src"

URL_MAPPINGS = {
    'http://localhost:8000/letalk/api/breakup-status': 'API.BREAKUP_STATUS',
    'http://localhost:8000/letalk/api/request-patchup/': 'API.REQUEST_PATCHUP',
    'http://localhost:8000/letalk/api/pair-partner/': 'API.PAIR_PARTNER',
    'http://localhost:8000/letalk/api/forgot-pin/': 'API.FORGOT_PIN',
    'http://localhost:8000/letalk/api/verify-reset-pin/': 'API.VERIFY_RESET_PIN',
    'http://localhost:8000/letalk/api/reminders/': 'API.REMINDERS',
    'http://localhost:8000/letalk/api/gallery/': 'API.GALLERY',
    'http://localhost:8000/letalk/api/upload-photo/': 'API.UPLOAD_PHOTO',
    'http://localhost:8000/letalk/api/notes/': 'API.NOTES',
    'http://localhost:8000/letalk/api/extras/': 'API.EXTRAS',
    'http://localhost:8000/letalk/api/update-profile/': 'API.UPDATE_PROFILE',
    'http://localhost:8000/letalk/api/change-pin/': 'API.CHANGE_PIN',
    'http://localhost:8000/letalk/api/breakup/': 'API.BREAKUP',
    'http://localhost:8000/letalk/api/get-messages/': 'API.GET_MESSAGES',
    'http://localhost:8000/letalk/api/send-message/': 'API.SEND_MESSAGE',
    'http://localhost:8000/letalk/api/support/': 'API.SUPPORT',
    # Note: refresh-token, get-user, login, signup, google-signin are in AuthContext already
}

def get_relative_api_import(filepath):
    rel_path = os.path.relpath(filepath, SRC_DIR)
    depth = rel_path.count(os.sep)
    if depth == 0:
        return "./config/api" # From App.tsx
    rel_prefix = "../" * depth
    return f"{rel_prefix}config/api"

def refactor():
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                if file == 'api.ts' or file == 'AuthContext.tsx':
                    continue
                    
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        
                    content = "".join(lines)
                    original_content = content
                    
                    # specific replacement for breakup-status with query parameters
                    if '`http://localhost:8000/letalk/api/breakup-status?email=${encodeURIComponent(email)}`' in content:
                        content = content.replace(
                            '`http://localhost:8000/letalk/api/breakup-status?email=${encodeURIComponent(email)}`',
                            '`${API.BREAKUP_STATUS}?email=${encodeURIComponent(email)}`'
                        )
                    
                    # specific for chat ws
                    if '`ws://localhost:8000/ws/chat/${user.partnerCode}/`' in content:
                        content = content.replace(
                            "`ws://localhost:8000/ws/chat/${user.partnerCode}/`",
                            "API.CHAT_WS(user.partnerCode)"
                        )

                    # simple string replacements
                    for url, api_const in URL_MAPPINGS.items():
                        content = content.replace(f"'{url}'", api_const)
                        content = content.replace(f'"{url}"', api_const)
                        
                    # find regex patterns: /notes/<id>/favorite/
                    content = re.sub(r"'http://localhost:8000/letalk/api/notes/' \+ ([a-zA-Z0-9_]+) \+ '/favorite/'", r"`${API.NOTES}${ \1 }/favorite/`", content)
                    content = re.sub(r"`http://localhost:8000/letalk/api/notes/\$\{([^}]+)\}/favorite/`", r"`${API.NOTES}${ \1 }/favorite/`", content)
                    content = re.sub(r"`http://localhost:8000/letalk/api/notes/\$\{([^}]+)\}/delete/`", r"`${API.NOTES}${ \1 }/delete/`", content)
                    content = re.sub(r"`http://localhost:8000/letalk/api/notes/\$\{([^}]+)\}/`", r"`${API.NOTES}${ \1 }/`", content)
                    content = re.sub(r"'http://localhost:8000/letalk/api/notes/' \+ ([a-zA-Z0-9_]+)", r"`${API.NOTES}${ \1 }/`", content)

                    content = re.sub(r"`http://localhost:8000/letalk/api/reminders/update/\$\{([^}]+)\}/`", r"`${API.REMINDERS}update/${ \1 }/`", content)
                    content = re.sub(r"`http://localhost:8000/letalk/api/reminders/\$\{([^}]+)\}/delete/`", r"`${API.REMINDERS}${ \1 }/delete/`", content)
                    content = re.sub(r"'http://localhost:8000/letalk/api/reminders/create/'", r"`${API.REMINDERS}create/`", content)

                    content = re.sub(r"`http://localhost:8000/letalk/api/gallery/edit-caption/\$\{([^}]+)\}/`", r"`${API.GALLERY}edit-caption/${ \1 }/`", content)
                    content = re.sub(r"`http://localhost:8000/letalk/api/gallery/delete-photo/\$\{([^}]+)\}/`", r"`${API.GALLERY}delete-photo/${ \1 }/`", content)
                    content = re.sub(r"`http://localhost:8000/letalk/api/gallery/toggle-like/\$\{([^}]+)\}/`", r"`${API.GALLERY}toggle-like/${ \1 }/`", content)

                    content = re.sub(r"'http://localhost:8000/letalk/api/extras/lovejar/add/'", r"`${API.EXTRAS}lovejar/add/`", content)
                    content = re.sub(r"'http://localhost:8000/letalk/api/extras/todo/add/'", r"`${API.EXTRAS}todo/add/`", content)
                    content = re.sub(r"`http://localhost:8000/letalk/api/extras/todo/\$\{([^}]+)\}/toggle/`", r"`${API.EXTRAS}todo/${ \1 }/toggle/`", content)

                    # Replace AuthContext usage of getToken missing
                    
                    if content != original_content:
                        import_path = get_relative_api_import(filepath)
                        
                        # special handle for App.tsx ClientID change and bg change
                        if file == 'App.tsx':
                            content = content.replace(
                                'clientId="1037758248458-o372odjqq94ctstj66pcrt601058hn1k.apps.googleusercontent.com"',
                                'clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}'
                            )
                            content = content.replace('bg-pink-50', 'bg-slate-50')
                        
                        # Add Import API
                        # We must inject import { API } from ... after the last import
                        if "import { API" not in content:
                            needs_auth_headers = False
                            needs_getAuthToken = False
                            
                            if "${API." in content or "API." in content:
                                parts = ["API"]
                                
                                # Let's also replace manual cookie parsing and localstorage
                                if "document.cookie" in content and "letalk=" in content:
                                    content = re.sub(r"const\s+cookieString\s*=\s*document\.cookie;.*?letalk=([^;]+).*?;", r"const token = getAuthToken();", content, flags=re.DOTALL)
                                    parts.append("getAuthToken")
                                    needs_getAuthToken = True
                                    
                                if "headers: {" in content and ("'Bearer '" not in content):
                                    # Just basic replacement for auth headers where token is manually injected
                                    pass

                                # If we use getAuthToken manually later
                                if "getToken()" in content and "AuthContext" not in content and "getAuthToken" not in content:
                                     # Let's replace simple localStorage.getItem('loveconnect_token') with getAuthToken()
                                     content = content.replace("localStorage.getItem('loveconnect_token')", "getAuthToken()")
                                     content = content.replace("localStorage.getItem('letalk_token')", "getAuthToken()")
                                     if "getAuthToken" not in parts: parts.append("getAuthToken")
                                     
                                import_stmt = f"import {{ {', '.join(parts)} }} from '{import_path}';\n"
                                
                                # Insert after last import
                                lines = content.split('\n')
                                last_import_idx = -1
                                for i, line in enumerate(lines):
                                    if line.startswith('import '):
                                        last_import_idx = i
                                        
                                if last_import_idx >= 0:
                                    lines.insert(last_import_idx + 1, import_stmt.strip())
                                else:
                                    lines.insert(0, import_stmt.strip())
                                    
                                content = '\n'.join(lines)
                                
                        # Handle specific Login case from prompt
                        if file == 'Login.tsx':
                           content = content.replace("login: authLogin,", "login: authLogin, googleLogin,")
                           content = content.replace("login: authLogin } = useAuth()", "login: authLogin, googleLogin } = useAuth()")
                           content = content.replace("login: authLogin, refreshUserData } = useAuth()", "login: authLogin, googleLogin, refreshUserData } = useAuth()")
                           content = content.replace("const { login, refreshUserData } = useAuth()", "const { login: authLogin, googleLogin, refreshUserData } = useAuth()")
                           
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Updated {file}")

                except Exception as e:
                    print(f"Error {file}: {e}")

if __name__ == "__main__":
    refactor()
