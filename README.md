# Inversave — brutalist multi-downloader

Bold, pastel, and fast. Inversave lets users search, preview, and download from YouTube, TikTok, Instagram, Spotify (search/playlists/new releases), and more—with proxy helpers for HLS/M3U8, images, and files.

## Highlights
- Multi-source search and download with localized routes under `app/[lang]/search/*`.
- Spotify flows for search, playlists, and new releases with card previews.
- Neobrutalist UI: thick borders, loud colors, chunky controls, smooth scroll + motion.
- Resilient API layer: HLS proxy, M3U8 conversion, proxy download/image endpoints, rate-friendly headers.
- Android packaging via Capacitor for a native feel and offline-ish UX.
- Built-in top up with automatic payment gateway (Saweria via NeoXR), QR/link pay, and 15-minute status auto-expiry.

## Feature Tour

### Payment & Credits
- **Automatic gateway**: NeoXR Saweria create/check endpoints with QR and pay URL, admin fee handling, and localization under `app/api/topup/*`.
- **Auto-status**: Pending payments are polled every 5 seconds; if no confirmation in 15 minutes they flip to failed; paid adds credits/bonus and updates role/expiry.
- **History experience**: Neo-brutalist history page with QR resurfacing, countdown timer, pay link, and clear paid/pending/failed badges.
- **Email notifications**: Successful topups trigger confirmation emails (see `sendTopupSuccessEmail`).

### Downloaders
- **Instagram**: Uses NeoXR IG endpoint; supports images with "Download All" and video; thumbnail proxied for fast loads.
- **YouTube/TikTok**: Search, preview, and download flows under `app/[lang]/search/*` and `app/api/download/*` with HLS proxy helpers.
- **Spotify**: Search, playlists, and new releases with playable previews and cards.
- **HLS/M3U8 tools**: Conversion and proxy endpoints to stabilize streaming/download.

### UX & Theming
- **Neobrutalist layout**: Thick borders, offset shadows, pastel gradients across landing, profile, and history.
- **Episode bars**: Flickreels-style episode selector rolled out across drama/watch/detail pages.
- **Profile polish**: Main-page-matching styling with stickers and strong typography.

### Platform Shell
- **Android (Capacitor)**: Sync and ship for a native feel; uses existing Capacitor bridge.

## Tech Stack
- Next.js 16 App Router + React 19 (TypeScript)
- Tailwind CSS 4 + framer-motion + Lenis
- NextAuth + Prisma ORM
- Sentry for monitoring
- Capacitor Android bridge

## Prerequisites
- Node.js 18+ and npm
- Database reachable via `DATABASE_URL` (Prisma)
- Environment secrets (set in `.env.local`): `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, SMTP creds for mail, Spotify credentials for search/new releases, optional `SENTRY_DSN`

## Setup
1) Copy your secrets into `.env.local` (see prerequisites).
2) Install deps:
	```bash
	npm install
	```
3) Generate Prisma client (needed after install or schema change):
	```bash
	npx prisma generate
	```
4) Run dev server:
	```bash
	npm run dev
	```
5) Open http://localhost:3000 and pick a locale to start searching.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm start` — run built app
- `npm run lint` — lint with ESLint
- `npm run cap:sync` — sync web assets to Android project
- `npm run cap:open` — open Android Studio project
- `npm run cap:build` — sync then open for build

## Android Build (quick path)
1) `npm run cap:sync`
2) `npm run cap:open`
3) Build/ship from Android Studio (keystore configured via `android/keystore.properties`).

## Project Layout
- `app/[lang]/search/*` — search pages per platform (YouTube, TikTok, Instagram, Spotify)
- `app/api/*` — download/proxy/search endpoints (m3u8 conversion, hls proxy, image/file proxy, Spotify search/new releases)
- `components/` — shared UI (navbar, search bars, cards, toasts, animations)
- `lib/` — auth, prisma client, SEO helpers, platform utilities
- `prisma/schema.prisma` — data model
- `android/` — Capacitor Android shell

## Tips
- If Spotify new releases look empty, check your Spotify credentials and upstream quota; API will return an error payload when the upstream is empty.
- After schema changes, rerun `npx prisma generate` and rebuild.
