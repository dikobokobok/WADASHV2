# WADASH (WhatsApp Dashboard & Bot System)

![WADASH Version](https://img.shields.io/badge/version-2.4.2-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![WhatsApp Bot](https://img.shields.io/badge/Bot-Baileys-green.svg)

WADASH (WhatsApp Dashboard) adalah sistem canggih yang memadukan keandalan sistem Bot WhatsApp otomatis dengan Web Dashboard yang intuitif dan modern. Program ini dirancang untuk memudahkan manajemen bot, konfigurasi perintah, pemantauan chat, dan integrasi API responder, yang dapat disesuaikan berdasarkan tipe paket berlangganan pengguna (Basic, Pro, Enterprise, dan Global Owner).

---

## 📸 Tampilan Utama Web (Dashboard)

![Main Dashboard Screenshot](https://c.top4top.io/p_3784uducx1.jpeg)
*(Tampilan Dashboard utama dengan desain modern, mode gelap/terang, dan kartu statistik interaktif)*

---

## ✨ Fitur Web Dashboard (Per Halaman)

Web Dashboard dibangun dengan **Next.js 15 (Turbopack)**, menampilkan desain antarmuka modern yang sangat responsif:

1. **Halaman Dashboard**
   - Menampilkan status utama dari sistem bot (Bot Status, Runtime, Expired At, dan Role Akun).
   - Layar pemantauan QR Code untuk integrasi koneksi WhatsApp secara *real-time*.
   - Widget sistem yang adaptif berdasarkan *Role* pengguna (menyembunyikan banner upgrade untuk user premium).

2. **Halaman Config**
   - Manajemen pengaturan fundamental bot seperti *Prefix* perintah, Bahasa (Language), dan batas Auto-Reply.

3. **Halaman Messages**
   - Terminal log *real-time* dan aliran data (*stream*) untuk memonitor percakapan WhatsApp dan aktivitas bot secara langsung.

4. **Halaman Commands**
   - Daftar perintah bot (plugins) yang terdaftar. Mengatur izin dan mematikan/menghidupkan (toggle) spesifik fungsi bot.

5. **Halaman API Chat Responder**
   - Fitur tingkat lanjut untuk menghubungkan respon bot ke URL endpoint API eksternal (Webhook).

6. **Halaman Menu & Catalog**
   - Mengubah struktur balasan menu utama bot dan membuat/mengelola katalog produk (Store/Shop) yang dapat diakses pengguna via WhatsApp.

7. **Halaman Settings (Profil & Keamanan)**
   - Manajemen profil pribadi (Username & Email).
   - Ganti *Password* dengan indikator visibilitas (ikon mata) dan otomatis melakukan *logout* dari semua perangkat demi keamanan.

8. **Halaman Ekstra (Pricing, FAQ, Changelog)**
   - Akses informasi berlangganan, bantuan teknis, serta pelacakan riwayat pembaruan (Changelog) versi WADASH.

---

## 🤖 Fitur Bot WhatsApp

Bot ini ditenagai oleh pustaka **Baileys** untuk konektivitas yang ringan dan cepat:

- **Sistem Plugin Dinamis**: Command/perintah dijalankan menggunakan modul-modul plugin terpisah (`!ping`, dll).
- **Role-Based Access Control (RBAC) Bot**:
  - `globOwner` (Pemilik Global): Memiliki kontrol penuh, termasuk akses ke eksekusi kode sensitif seperti `!eval` dan `!exec`.
  - `Owner` (Pemilik Bot Lokal): Mengakses perintah administrasi standar.
  - `User`: Pengguna standar.
- **Multidevice Support**: Mendukung fitur WhatsApp Multidevice secara asli.

---

## 🛡️ Fitur Keamanan Sistem

WADASH memprioritaskan privasi dan keamanan pengguna dan sistem melalui perlindungan ketat:

- **Enkripsi Kata Sandi (Bcrypt & Pepper)**: Password di-hash menggunakan algoritma Bcrypt (12 Rounds) ditambah *environment pepper* agar mustahil didekripsi secara terbalik.
- **Sistem Sesi JWT & CSRF Token**: Semua akses API dilindungi menggunakan validasi *Cookie Session* (JTI) yang terenkripsi aman, mencegah serangan *Cross-Site Request Forgery*.
- **Otomatis Blokir (Lockout System)**: Jika terjadi kegagalan login sebanyak 5 kali berturut-turut, akun akan dikunci sementara selama 30 menit untuk mencegah metode peretasan *Brute-Force*.
- **Revoke All Sessions**: Saat *password* diubah, seluruh sesi pengguna yang aktif (baik di HP maupun PC lain) akan seketika dihanguskan (*log out* massal).
- **Cloudflare Turnstile CAPTCHA**: Opsional integrasi CAPTCHA pada proses pendaftaran (Sign Up) untuk menghalau bot spammer.

---

## 🧪 Uji Coba & Informasi Akun Pengetesan

WADASH saat ini berjalan dengan stabil di:
**Versi: 2.4.2**

Untuk tujuan pengetesan (Testing), Anda dapat menggunakan akun *Global Owner* yang telah disediakan secara lokal dengan kredensial berikut:

- **Username**: `inu`
- **Password**: `@Inu123`

---

*© 2026 WADASH Development - Hak Cipta Dilindungi.*
