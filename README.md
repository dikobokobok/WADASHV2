# WADASHV2 🤖

**WADASH V2** adalah dashboard modern untuk mengelola WhatsApp Bot dengan antarmuka yang elegan, bersih, dan profesional. Dibangun menggunakan Next.js 15 dengan TypeScript dan Tailwind CSS.

![Version](https://img.shields.io/badge/version-2.2-violet)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📸 Screenshots

### 🔐 Login Page
![Login Page](./public/screenshots/login.png)

### ☀️ Dashboard — Light Mode
![Dashboard Light Mode](./public/screenshots/dashboard-light.png)

### 🌙 Dashboard — Dark Mode
![Dashboard Dark Mode](./public/screenshots/dashboard-dark.png)

### ⚙️ Bot Configuration
![Config Page](./public/screenshots/config.png)

---

## ✨ Fitur Utama

### 🔐 Sistem Autentikasi
- Login & Register dengan validasi form
- Login menggunakan **username atau email**
- Session management dengan HTTP-only cookies
- Auto-redirect untuk session yang tidak valid atau expired
- Middleware proteksi untuk semua route dashboard

### 🎨 UI/UX Modern (v2.2)
- **Dark Mode & Light Mode** — full theme support dengan toggle smooth, persisten via localStorage
- **Responsive Design** — optimal di semua perangkat (mobile, tablet, desktop)
- **Glassmorphism Header** — efek blur + transparansi pada header sticky
- **Smooth Page Transitions** — animasi `fade-in` saat berpindah tab
- **Skeleton Loading** — placeholder animasi saat data sedang dimuat
- **Micro-animations** — hover scale, translate, dan shadow pada elemen interaktif
- **Font Inter** — tipografi modern dari Google Fonts
- **CSS Variables** — sistem token warna konsisten untuk light & dark mode

### 🧭 Sidebar Navigation
- Sidebar fixed 240px dengan scroll navigasi vertikal
- Grup navigasi: **General**, **Bot**, **User**
- Active state dengan gradient violet-indigo + chevron indicator
- Inactive state dengan hover overlay transparan (tidak konflik antar mode)
- Logo header sejajar dengan main header (tinggi `64px` / `h-16`)
- **Light mode**: background putih, teks gelap yang terbaca
- **Dark mode**: background dark navy, teks terang
- User footer dengan avatar, nama, dan plan

### 📊 Dashboard
- **Upgrade Banner** — CTA untuk upgrade plan dengan gradient violet
- **Stat Cards (4 kartu)**:
  - Bot Status (Online/Offline)
  - Expired At (tanggal expired subscription)
  - Runtime (uptime tracking bot)
  - Role (Basic Plan / Premium)
- **Bot Logs Card** — terminal viewer dengan status koneksi real-time (violet-themed di light mode)
- **Control Panel** — segmented button row: **Start Bot**, Stop Bot, Delete
- **Quick Links** — shortcut ke Commands, Catalog, Affiliate, Invoice

### ⚙️ Bot Configuration (Tab Config)
- **Bot Information** — botName, footerText
- **Sticker Configuration** — packname, authorname
- **Limits & Balance** — default limit dan balance untuk user baru
- **Owner Information** — ownerName, ownerNumber
- **Prefix Settings** — karakter prefix + mode (Single / Multi / No Prefix) via radio pill
- **Bot Features** — 5 toggle switch untuk mengaktifkan/menonaktifkan fitur:
  - Online On Connect
  - Premium Notification
  - Sewa Notification → Group
  - Sewa Notification → Owner
  - Join To Use
- Status feedback (success / error) setelah save
- Tombol Save dengan gradient violet

### ⚡ Performa
- **Lazy config loading** — konfigurasi bot hanya di-fetch saat tab Config dibuka
- **Config caching** — tidak re-fetch saat bolak-balik tab (menggunakan `configLoaded` flag)
- **Parallel data fetching** — user data dan config di-fetch secara terpisah dan independen
- **useCallback** — fungsi fetch di-memoize untuk menghindari re-render tidak perlu
- **Turbopack** — development server lebih cepat dengan `--turbopack`

### 🧹 Code Quality (v2.2)
- Arsitektur modular: komponen kecil dan fokus (`SidebarButton`, `NavSection`, `StatCardItem`, `BotLogsCard`, `ControlPanelCard`, `DashboardContent`, dst.)
- Semua data statis sebagai typed constants (`NAV_ITEMS`, `STAT_CARDS`, `QUICK_LINKS`)
- Props-drilling minimal dengan interface TypeScript yang eksplisit
- `import type` untuk type-only imports
- `parseInt` dengan radix 10
- Komentar section divider untuk keterbacaan

### 💾 Database
- File-based JSON database (`database/database.json`)
- Per-user configuration storage
- Default configuration untuk user baru
- Easy backup dan migration

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, atau bun

### Installation

1. Clone repository:
```bash
git clone https://github.com/dikobokobok/WADASHV2.git
cd WADASHV2
```

2. Install dependencies:
```bash
npm install
```

3. Jalankan development server:
```bash
npm run dev
```

4. Buka browser dan akses [http://localhost:3000](http://localhost:3000)

### Default Accounts

| Role  | Username    | Email                  | Password      |
|-------|-------------|------------------------|---------------|
| Admin | `admin`     | `admin@wadash.me`      | `admin123`    |
| Test  | `TestUser`  | `test@example.com`     | `password123` |

---

## 📁 Struktur Project

```
WADASHV2/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/             # Login, Register, Logout
│   │   │   ├── config/           # Get & Update bot config
│   │   │   └── user/             # Get user data
│   │   ├── login/                # Halaman login
│   │   ├── register/             # Halaman register
│   │   ├── globals.css           # CSS variables & global styles
│   │   └── page.tsx              # Dashboard (modular components)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── ConfigForm.tsx        # Form konfigurasi bot
│   │   ├── ThemeProvider.tsx     # Context provider dark/light mode
│   │   └── ThemeToggle.tsx       # Tombol toggle tema
│   └── lib/
│       ├── auth.ts               # Helper autentikasi & cookie
│       ├── database.ts           # Operasi baca/tulis database
│       └── utils.ts              # Utilitas umum
├── database/
│   └── database.json             # Penyimpanan user & konfigurasi
└── public/                       # Static assets
```

---

## 🛠️ Tech Stack

| Kategori       | Teknologi                        |
|----------------|----------------------------------|
| Framework      | Next.js 15 (App Router)          |
| Language       | TypeScript 5                     |
| Styling        | Tailwind CSS 3                   |
| UI Components  | shadcn/ui + Radix UI             |
| Icons          | Lucide React                     |
| Database       | File-based JSON (flat-file)      |
| Authentication | Cookie-based sessions (HTTP-only)|
| Dev Server     | Turbopack                        |

---

## 📝 API Endpoints

### Authentication
| Method | Endpoint              | Deskripsi           |
|--------|-----------------------|---------------------|
| POST   | `/api/auth/register`  | Register user baru  |
| POST   | `/api/auth/login`     | Login user          |
| POST   | `/api/auth/logout`    | Logout user         |

### User
| Method | Endpoint    | Deskripsi                       |
|--------|-------------|---------------------------------|
| GET    | `/api/user` | Ambil data user (authenticated) |

### Configuration
| Method | Endpoint      | Deskripsi                                |
|--------|---------------|------------------------------------------|
| GET    | `/api/config` | Ambil konfigurasi bot (authenticated)    |
| POST   | `/api/config` | Update konfigurasi bot (authenticated)   |

---

## 🔧 Bot Configuration Fields

| Field                      | Type                   | Deskripsi                         |
|----------------------------|------------------------|-----------------------------------|
| `botName`                  | string                 | Nama bot WhatsApp                 |
| `packname`                 | string                 | Nama package untuk sticker        |
| `authorname`               | string                 | Nama author untuk sticker         |
| `footerText`               | string                 | Footer text untuk pesan           |
| `limit`                    | number                 | Limit penggunaan per user         |
| `balance`                  | number                 | Balance awal user baru            |
| `ownerName`                | string                 | Nama owner bot                    |
| `ownerNumber`              | string                 | Nomor WhatsApp owner              |
| `prefix`                   | string                 | Karakter prefix command           |
| `prefixType`               | single / multi / empty | Mode prefix                       |
| `onlineOnConnect`          | boolean                | Bot online saat connect           |
| `premiumNotification`      | boolean                | Notifikasi premium expiry         |
| `sewaNotificationToGroup`  | boolean                | Notif sewa ke group               |
| `sewaNotificationToOwner`  | boolean                | Notif sewa ke owner               |
| `joinToUse`                | boolean                | Wajib join group sebelum pakai    |

---

## 🎨 Theme System

WADASHV2 mendukung dark mode dan light mode sepenuhnya:
- **CSS Variables** sebagai token warna (`--background`, `--foreground`, `--card`, dll.)
- **Semantic classes** via Tailwind (`bg-background`, `text-foreground`, `border-border`)
- Transisi smooth antar tema
- Preferensi tema tersimpan di `localStorage`
- Deteksi tema sistem (system preference)

---

## 🔒 Security Notes

> ⚠️ **PENTING untuk Production:**
> - Implementasikan password hashing (bcrypt / argon2)
> - Gunakan environment variables untuk secrets
> - Implementasikan rate limiting pada API routes
> - Tambahkan CSRF protection
> - Gunakan HTTPS
> - Migrasi database ke PostgreSQL (Supabase) untuk concurrency yang aman

---

## 🚧 Roadmap

- [ ] Password hashing dengan bcrypt
- [ ] Real-time bot status via WebSocket
- [ ] Live log streaming
- [ ] Multi-bot support
- [ ] Advanced analytics dashboard
- [ ] API key management
- [ ] Webhook integration
- [ ] Export / Import konfigurasi
- [ ] Migrasi database ke Supabase (PostgreSQL)

---

## 📄 License

MIT License — bebas digunakan untuk keperluan personal maupun komersial.

---

## 👨‍💻 Author

**dikobokobok**
- GitHub: [@dikobokobok](https://github.com/dikobokobok)
- Repository: [WADASHV2](https://github.com/dikobokobok/WADASHV2)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) — The React Framework
- [shadcn/ui](https://ui.shadcn.com/) — Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Lucide](https://lucide.dev/) — Beautiful open-source icons
- [Radix UI](https://www.radix-ui.com/) — Accessible component primitives

---

**Version:** 2.2  
**Last Updated:** April 19, 2025

Made with ❤️ by dikobokobok
