# Changelog

Semua perubahan yang penting untuk proyek ini didokumentasikan di sini.
Format mengacu pada [Keep a Changelog](https://keepachangelog.com/) dan
proyek ini mengikuti [Semantic Versioning](https://semver.org/).

## [2.4.3] - 2026-05-17

### Added
- **Plugin `!mal`** — Lookup MyAnimeList: pencarian anime, detail (info), daftar
  musiman (`season`), watchlist user, dan berita terbaru. Integrasi dengan
  library `mal-scraper`.
- **Plugin `!primbon`** — 10 fitur ramalan Primbon (arti nama, tafsir mimpi,
  kecocokan pasangan, tanggal jadian, watak artis, ramalan jodoh weton, rezeki
  weton, kecocokan nama & tanggal lahir, hari baik, hari larangan). Integrasi
  dengan library `primbon-scraper` dan ambient TypeScript declarations di
  `src/types/primbon-scraper.d.ts`.
- **Plugin `!yt` / `!ytmp4` / `!ytmp3`** — YouTube downloader berbasis
  `youtubei.js` v17. Mendukung subcommand `search`, `mp4`, `mp3`, dengan
  pemilihan kualitas otomatis dan guardrails (durasi maksimum 30 menit, ukuran
  maksimum 60 MB) agar aman dengan limit upload WhatsApp.

### Changed
- README diperbarui dengan tabel daftar plugin bawaan.
- Bumped versi ke **2.4.3**.

### Notes
- Plugin YouTube menggunakan pendekatan `Platform.shim.eval` yang
  direkomendasikan dokumentasi resmi `youtubei.js` untuk men-decipher streaming
  URL.

## [2.4.2] - 2026-05-13

### Added
- **Plugin `!genshin` / `!gi`** — Lookup karakter Genshin Impact dengan detail
  vision, weapon, talents, passives, constellations, dan portrait image.
- **Plugin `!wallpaper` / `!wp` / `!anime`** — Cari wallpaper anime dari
  WallHaven, ZeroChan, Pinterest, dan Live2D (Moe Walls).
- **Plugin `!tiktok` / `!tt`** — Downloader video TikTok tanpa watermark
  beserta metadata (author, statistik, durasi).

### Improved
- Sistem plugin diperluas dengan kategori (`general`, `download`, `sticker`,
  `owner`) untuk membangun menu dinamis.
- Pola umum `sendWithTyping` + reaksi loading/success/error diterapkan
  konsisten di semua plugin baru.

## [2.4.1] - 2026-05-10

### Added
- Plugin `!sticker` dengan konversi gambar/video → animated WebP via FFmpeg.
- Plugin `!ping`, `!owner`, `!checkrole` sebagai fondasi awal sistem plugin.
- Resolver path FFmpeg yang aman untuk environment Next.js (mengatasi corrupt
  `__dirname` dari ffmpeg-static di webpack).

## [2.0.0] - 2026-05-12

### Added
- Complete UI overhaul dengan dashboard baru.
- Secure session deletion dengan inline verification modal.
- CSS-based dynamic loading spinners untuk UX yang lebih halus.

### Improved
- Layout split-screen pada halaman Login dan Register.

## [1.5.2] - 2026-04-28

### Added
- Tab konfigurasi API Chat Responder.

### Improved
- Palet warna dark mode disempurnakan untuk kontras yang lebih baik.

### Fixed
- Indikator status bot kadang desync dengan kondisi koneksi sebenarnya.

## [1.5.0] - 2026-04-10

### Added
- Streaming log bot ke dashboard secara real-time.
- Optimasi rendering QR code untuk pemindaian yang lebih cepat.

### Fixed
- Memory leak pada sesi yang berjalan lama.

## [1.0.0] - 2026-01-15

### Added
- Rilis perdana WADASH Bot Dashboard.
- Konfigurasi dasar dan menu setup.
- Kontrol Start/Stop/Delete bot.
