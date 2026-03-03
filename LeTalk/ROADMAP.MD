🗺️ Letalk — Complete Project Roadmap

## Phase 0 — Rebranding & UI Persona 🎨
Prioritas Utama — Dikerjakan paling pertama sebelum apapun

- [x] Ganti semua teks "LoveConnect" → "Letalk" di seluruh file React
- [x] Update <title> dan favicon di index.html
- [x] Review & sesuaikan color palette (konsep "Mediator/Neutral AI")
- [x] Tambah elemen visual AI Mediator
      └── Robot mediator kecil / mascot
      └── Animasi gelombang emosi (nice-to-have, bisa belakangan)

## Phase 1 — Foundation (Backend + Auth) 🔐
Semua fitur bergantung pada fase ini

- [ ] User Registration & Login (JWT)
- [ ] Google OAuth login
- [ ] Sistem Pairing (invite kode untuk menghubungkan pasangan)
- [ ] Profile completion
- [ ] MongoDB connection setup

## Phase 2 — Core Chat 💬
Inti dari aplikasi — harus jalan dulu sebelum AI diintegrasikan

- [ ] WebSocket consumer (real-time messaging)
- [ ] REST API untuk chat history
- [ ] Redis channel layer untuk WebSocket
- [ ] Kirim & terima pesan real-time
- [ ] UI Chat dasar di Chat.tsx (bubble, input, send)

## Phase 3 — AI Integration (Core Letalk Experience) 🤖
Ini yang membedakan Letalk dari chat app biasa

- [ ] Integrasi ml-emotion ke dalam alur chat
      └── Setiap pesan dikirim → ML emotion dipanggil → hasilnya disimpan
- [ ] Emotion Bubbles di UI
      └── Munculkan emoji di pojok bubble chat (😡 anger, 😍 joy, dll.)
- [ ] Integrasi ml-toxicity ke dalam alur chat
      └── Pesan toxic → diblokir otomatis sebelum terkirim
- [ ] Conflict detection logic (ConflictManager)
- [ ] Conflict Lock UI
      └── Overlay "Cooling Down" otomatis saat konflik terdeteksi
      └── Timer hitung mundur 5 menit
- [ ] Cooldown mechanism di backend (auto-lock 5 menit)
- [ ] Personal AI Reflection (Google Gemini)
      └── Selama cooldown → tampilkan pesan refleksi personal dari Gemini
      └── Contoh: "Kamu tadi agak kasar, coba renungkan..."

## Phase 4 — Personality Quiz & AI Profiling 🧠
Dikerjakan setelah chat + AI sudah berjalan

- [ ] Verifikasi endpoint backend ai/personality-quiz/ berjalan
- [ ] Buat halaman PersonalityQuiz.tsx
      └── 10-15 pertanyaan tentang cara menangani konflik
      └── Pertanyaan tentang cara mengekspresikan kasih sayang
- [ ] Hubungkan hasil kuis ke backend
- [ ] Gemini Profiling
      └── AI mengenal kepribadian User A & User B sebelum mulai chat
- [ ] Tambahkan route /personality-quiz di App.tsx
- [ ] Integrasikan quiz ke alur onboarding (setelah pairing)

## Phase 5 — Frontend Pages Lengkap 🎨
Semua halaman dashboard dilengkapi kontennya

- [ ] Dashboard layout (DashboardLayout.tsx)
- [ ] Halaman Pairing (UI + koneksi ke backend)
- [ ] Gallery — foto/kenangan bersama
- [ ] Notes — catatan bersama
- [ ] Timeline — milestone hubungan
- [ ] Reminders — pengingat penting
- [ ] Settings & Profile
- [ ] Extras

## Phase 6 — Mood Dashboard 📊
Dikerjakan SETELAH ada data historis dari Phase 3

- [ ] Emotion Graph
      └── Visualisasi dominasi emosi dalam seminggu terakhir
      └── Apakah lebih banyak joy atau annoyance?
- [ ] Relationship Health Score (angka 1–100)
      └── Dihitung dari analisis AI Mediator
- [ ] Backend endpoint untuk agregasi data emosi historis
- [ ] Integrasi chart library (Recharts / Chart.js)

## Phase 7 — Dockerization & Deploy 🚀
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
1. Phase 0 → Rebranding & UI Persona (MULAI DI SINI)
2. Phase 1 → Backend + Auth Foundation
3. Phase 2 → Core Chat (WebSocket jalan)
4. Phase 3 → AI Integration (INTI Letalk)
5. Phase 4 → Personality Quiz & Gemini Profiling
6. Phase 5 → Frontend Pages Lengkap
7. Phase 6 → Mood Dashboard (butuh data dulu)
8. Phase 7 → Docker + Deploy
