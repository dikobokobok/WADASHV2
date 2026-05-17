---
description: wadash
---

Proyek: WADASH (WhatsApp Bot Dashboard — Multi-User)
1. Ringkasan Eksekutif
WADASH adalah platform manajemen WhatsApp Bot Multi-User berbasis web yang memungkinkan pengguna untuk mengelola bot pribadi melalui dashboard modern. Sistem ini menggunakan Baileys untuk integrasi WhatsApp API dan mengadopsi skema database JSON-per-user untuk fleksibilitas penyimpanan lokal.

2. Arsitektur Teknis & Database
Core Stack
Backend: Node.js (Express atau Fastify).

WhatsApp API: Library @whiskeysockets/baileys.

Frontend: Light Theme, Clean Modern UI, Responsive Design.

Auth: JWT (JSON Web Token) dengan Password Hashing (Bcrypt/Argon2).

Komunikasi Real-time: Socket.io untuk transmisi QR Code dari server ke dashboard.

Struktur Database (JSON-Based)
Penyimpanan dilakukan secara terisolasi per user menggunakan folder berbasis UUID untuk mencegah konflik data:

global_admin.json: Data master untuk Owner/Admin (Statistik sistem, daftar semua user, logs keamanan).

{uuid}.profile.json: Profil akun dashboard (Username, Role, Masa aktif langganan).

{uuid}.settings.json: Konfigurasi bot (Prefix, Nama bot, fitur Toggle: Sticker, Anti-call, dll).

{uuid}.bot.json: Data operasional bot (Daftar kontak pengguna bot, statistik hit command, pesan terkirim).

sessions/{uuid}/: Folder kredensial Baileys untuk fitur Session Persistence.

3. Fitur Utama Dashboard
A. Autentikasi & Otorisasi
Sistem Login/Register: Akses terproteksi untuk user.

Role Management:

Admin/Owner: Akses ke Admin Panel, monitoring server, dan manajemen lisensi.

Premium User: Akses multi-bot, fitur custom menu, dan broadcast prioritas.

Basic User: Akses single bot dengan fitur standar.

B. Dashboard Utama (Status Control)
Status Card: Indikator Online/Offline, Tanggal Expired, dan Runtime.

Real-time QR Scanner: Scan QR langsung dari dashboard untuk pairing.

Control Panel: Tombol Start, Stop, dan Logout session bot.

Activity Logs: Menampilkan log aktivitas bot secara real-time.

C. Bot Management (CRUD)
Config: Pengaturan prefix (e.g., !, ., /) dan nama bot.

Mess & Command: CRUD untuk pesan otomatis, template reply, dan pengaturan fitur (On/Off).

Menu & Catalog: Pengaturan tampilan menu interaktif dan pengelolaan katalog produk pada WhatsApp.

Broadcast: Antrian pengiriman pesan massal ke banyak kontak.

D. Billing & Support
Pricing: Pilihan paket upgrade (Basic ke Premium).

Invoice: Riwayat pembayaran dan status langganan.

Support: FAQ berbasis accordion dan Changelog update sistem.

4. Alur Kerja Integrasi Baileys
Initialization: User menekan "Start Bot" di dashboard.

Socket Connection: Server meminta Baileys menginisialisasi socket. Jika belum login, QR Code dikirim ke dashboard via Socket.io.

Session Saving: Setelah discan, session disimpan ke folder user. Bot otomatis reconnect jika server restart.

Message Handling: Setiap pesan masuk diproses berdasarkan aturan di {uuid}.settings.json dan {uuid}.bot.json.

5. Keamanan & Best Practices
ID-Based Storage: Menggunakan UUID untuk penamaan file JSON guna menghindari serangan path traversal.

File Locking: Implementasi lowdb atau fs-extra untuk mencegah korupsi data saat proses penulisan bersamaan.

RLS (Row Level Security) Logic: Memastikan middleware Express memvalidasi bahwa User A hanya bisa membaca/menulis file JSON milik User A.

Encrypted Secrets: API Key dan password tidak disimpan dalam bentuk plain text.

6. Struktur Navigasi (Sidebar)
Main: Dashboard, Pricing, FAQ's, Changelog.

BOT Management: Config, Mess, Command, Filter Command, Menu, Catalog.

USER Area: Setting Profile, Invoice, Affiliate Program.

Admin Panel: (Khusus Role Admin) User List, System Stats, Security Logs.

