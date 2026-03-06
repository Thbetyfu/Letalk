🗺️ Letalk — Complete Project Roadmap

## Phase 0 — Rebranding & UI Persona 🎨
Prioritas Utama — Dikerjakan paling pertama sebelum apapun

- [x] Ganti semua teks "LoveConnect" → "Letalk" di seluruh file React
- [x] Update <title> dan favicon di index.html
- [x] Review & sesuaikan color palette (konsep "Mediator/Neutral AI")
- [x] Fix bg-pink-50 → bg-slate-50 di App.tsx
- [x] Tambah elemen visual AI Mediator
      └── Robot mediator kecil / mascot
      └── Animasi gelombang emosi (nice-to-have, bisa belakangan)

## Phase 1 — Foundation (Backend + Auth) 🔐
Semua fitur bergantung pada fase ini

- [x] User Registration & Login (JWT)
- [x] Google OAuth login
- [x] Sistem Pairing (invite kode untuk menghubungkan pasangan)
- [x] Profile completion
- [x] MongoDB connection setup

## Phase 2 — Frontend API Refactor 🛠️
Sentralisasi API URL & token management agar mudah dikonfigurasi

### SUB-PHASE 2A — Centralized API Config
URUTAN WAJIB (jangan diacak):

- [x] 2A-1  Buat src/config/api.ts (SELESAI — semua konstanta API terpusat)
- [x] 2A-2  Buat Frontend/.env dan .env.example (SELESAI — VITE_API_URL, VITE_WS_URL, VITE_GOOGLE_CLIENT_ID)
- [x] 2A-3  Rename 'loveconnect_token' → 'letalk_token' di AuthContext.tsx (SELESAI)
- [x] 2A-4  Pindahkan Google Client ID ke env variable di App.tsx (SELESAI)
- [x] 2A-5  Fix bg-pink-50 → bg-slate-50 di App.tsx (SELESAI)

### SUB-PHASE 2B — AuthContext Refactor
- [x] 2B-1  Refactor AuthContext.tsx: ganti semua URL pakai API.* (SELESAI)
- [x] 2B-2  Fix bug kritis: token login tidak disimpan ke localStorage (SELESAI)
- [x] 2B-3  Fix logout: panggil backend + hapus cookie + hapus localStorage (SELESAI)
- [x] 2B-4  Tambahkan googleLogin() handler di AuthContext.tsx (SELESAI)

### SUB-PHASE 2C — Update Semua Pages & Components
- [x] 2C-1  Update Login.tsx: pakai API.* + connect googleLogin handler (SELESAI)
- [x] 2C-2  Update Signup.tsx: flow signup → /pairing (SELESAI)
- [x] 2C-3  Update Pairing.tsx: pakai API.* (SELESAI)
- [x] 2C-4  Update ForgotPin.tsx: pakai API.* (SELESAI)
- [x] 2C-5  Update ReminderNotificationContext.tsx: pakai API.* + getAuthToken() (SELESAI)
- [x] 2C-6  Update Gallery.tsx: pakai API.* (SELESAI)
- [x] 2C-6  Update Notes.tsx: pakai API.* (SELESAI)
- [x] 2C-6  Update Reminders.tsx: pakai API.* (SELESAI)
- [x] 2C-6  Update Extras.tsx: pakai API.* (SELESAI)
- [x] 2C-6  Update Settings.tsx: pakai API.* (SELESAI)
- [x] 2C-6  Update Chat.tsx: pakai API.* (SELESAI)
- [x] 2C-6  Update Support.tsx: pakai API.* (SELESAI)
- [x] 2C-6  Update ProfileCompletion.tsx: pakai API.* (SELESAI)

### SUB-PHASE 2D — Dev Quality of Life
- [x] 2D-1  Tambahkan dev proxy di vite.config.ts (SELESAI — /letalk → :8000, /ws → :8000 WS)

### FINAL — Test End-to-End
- [x] Signup baru → redirect ke /pairing ✅ (Browser test PASS)
- [x] Login PIN → masuk dashboard ✅ (API + Browser test PASS)
- [ ] Login Google → masuk dashboard (belum test — perlu GOOGLE_CLIENT_ID production)
- [x] Logout → redirect ke /login, token terhapus ✅ (API + Browser test PASS)
- [ ] Forgot PIN → email terkirim → PIN baru bisa login (SMTP belum dikonfigurasi)
- [x] Refresh halaman → tetap login (token persist) ✅ (Browser test PASS)

## Phase 3 — Core Chat 💬
Inti dari aplikasi — harus jalan dulu sebelum AI diintegrasikan

- [x] WebSocket consumer (real-time messaging)
- [x] REST API untuk chat history
- [x] Redis channel layer untuk WebSocket
- [x] Kirim & terima pesan real-time
- [x] UI Chat dasar di Chat.tsx (bubble, input, send)

## Phase 4 — AI Integration (Core Letalk Experience) 🤖
Ini yang membedakan Letalk dari chat app biasa

- [x] Integrasi ml-emotion ke dalam alur chat
      └── Setiap pesan dikirim → ML emotion dipanggil → hasilnya disimpan
- [x] Emotion Bubbles di UI
      └── Munculkan emoji di pojok bubble chat (😡 anger, 😍 joy, dll.)
- [x] Integrasi ml-toxicity ke dalam alur chat
      └── Pesan toxic → diblokir otomatis sebelum terkirim
- [x] Conflict detection logic (ConflictManager)
- [x] Conflict Lock UI
      └── Overlay "Cooling Down" otomatis saat konflik terdeteksi
      └── Timer hitung mundur 5 menit
- [x] Cooldown mechanism di backend (auto-lock 5 menit)
- [x] Personal AI Reflection (Google Gemini)
      └── Selama cooldown → tampilkan pesan refleksi personal dari Gemini
      └── Contoh: "Kamu tadi agak kasar, coba renungkan..."

### SUB-PHASE 4 — Frontend Refactoring & Bug Fixes
- [x] 4A Gallery.tsx: API.*, hapus fetchUser duplikat, fix uploadedBy, fix liked state, tambah toast
- [x] 4B Notes.tsx: API.*, fix header sticky, fix toggleFavorite token, fix handleSaveNote, delete confirm modal
- [x] 4C Reminders.tsx: API.*, local state update (no refetch), browser notification, timezone fix
- [x] 4D Extras.tsx: Hapus location.reload() → state update, API.*, error handling, empty state LoveJar
- [x] 4E Settings.tsx: API.*, handleSaveProfile toast, handleChangePin error read, camera coming soon, hapus unused hearts state

## Phase 5 — Personality Quiz & AI Profiling 🧠
Dikerjakan setelah chat + AI sudah berjalan

- [x] Verifikasi endpoint backend ai/personality-quiz/ berjalan ✅
- [x] Buat halaman PersonalityQuiz.tsx ✅
      └── 12 pertanyaan: Conflict Handling, Love Language, Communication, Sensitivity, Patience, Values, Coping, Self Awareness
      └── Multi-step UI dengan progress bar + step indicator
- [x] Hubungkan hasil kuis ke backend ✅ (POST /ai/personality-quiz/ → Gemini → profil tersimpan di MongoDB)
- [x] Gemini Profiling ✅
      └── AI mengenal kepribadian user dari jawaban quiz
      └── Menghasilkan: personality_type, love_language, conflict_handling, communication_style, meter empathy/patience/sensitivity
- [x] Tambahkan route /personality-quiz di App.tsx ✅
- [x] Integrasikan quiz ke alur onboarding (setelah pairing → quiz → chat) ✅
- [x] Tampilkan Personality Profile di Settings.tsx + tombol Retake Quiz ✅
- [x] Tambahkan API.PERSONALITY_QUIZ, API.MOOD_DASHBOARD, API.ANALYZE_CONVERSATION di api.ts ✅

## Phase 6 — Frontend Pages Lengkap 🎨
Semua halaman dashboard dilengkapi kontennya

- [x] Dashboard layout (DashboardLayout.tsx) ✅
- [x] Halaman Pairing (UI + koneksi ke backend) ✅
- [x] Gallery — foto/kenangan bersama ✅
- [x] Notes — catatan bersama ✅
- [x] Timeline — milestone hubungan ✅ (Backend + CRUD persisten)
- [x] Reminders — pengingat penting ✅
- [x] Settings & Profile ✅
- [x] Extras ✅

## Phase 7 — Mood Dashboard 📊
Dikerjakan SETELAH ada data historis dari Phase 4

- [x] Emotion Graph ✅ (Visualisasi Bar chart distribusi emosi terbaru)
- [x] Relationship Health Score ✅ (Angka 10-100 dihitung dari harmoni percakapan)
- [x] Backend endpoint untuk mood & analisis percakapan ✅
- [x] Integrasi chart library (Recharts) ✅
- [x] AI Insights (Kabar Baik, Isu Potensial, Tip Personal) ✅

## Phase 8 — Dockerization & Deploy 🚀
Dikerjakan terakhir setelah semua service bisa jalan lokal

- [ ] docker-compose.yml lengkap
      └── Django Backend      → Port 8000
      └── React Frontend      → Port 5173
      └── ML Emotion Service  → Port 8001
      └── ML Toxicity Service → Port 8002
      └── MongoDB             → Port 27017
      └── Redis               → Port 6379
- [ ] Environment variables (.env) terkonfigurasi lengkap
- [ ] Health check tiap service
- [ ] Testing end-to-end
- [ ] Deploy ke server / cloud

## 📅 Ringkasan Urutan Pengerjaan
1. Phase 0 → Rebranding & UI Persona ✅ SELESAI
2. Phase 1 → Backend + Auth Foundation ✅ SELESAI
3. Phase 2 → Frontend API Refactor ✅ SELESAI (E2E test PASS — Google login & Forgot PIN belum karena config)
4. Phase 3 → Core Chat (WebSocket jalan) ✅ SELESAI
5. Phase 4 → AI Integration (INTI Letalk) ✅ SELESAI + Frontend Refactoring ✅ SELESAI
6. Phase 5 → Personality Quiz & Gemini Profiling ✅ SELESAI
7. Phase 6 → Frontend Pages Lengkap ✅ SELESAI
8. Phase 7 → Mood Dashboard ✅ SELESAI
9. Phase 8 → Docker + Deploy ← NEXT
