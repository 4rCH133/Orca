# Orca — Reddit Client for iOS & Android

> "Reddit, the way it should feel."

A fast, sleek Reddit client built with React Native + Expo. True OLED black design, offline-capable liked/saved post search, and a clean reading experience.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript (strict) |
| Navigation | Expo Router v6 (file-based) |
| Server State | TanStack Query v5 |
| Local State | Zustand v5 |
| Fast Storage | MMKV |
| Local Search DB | Expo SQLite + FTS5 |
| Backend | Supabase (PostgreSQL + RLS) |
| API Cache | Upstash Redis (REST) |
| Auth | Reddit OAuth2 via expo-auth-session |
| Lists | FlashList (Shopify) |
| Images | expo-image |
| Styling | NativeWind (Tailwind CSS) |
| CI/CD | EAS (Expo Application Services) |

---

## Prerequisites

Before you begin, install the following:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20+ LTS | https://nodejs.org |
| Git | Any | https://git-scm.com |
| Java JDK | 17 | https://adoptium.net |
| Android Studio | Latest | https://developer.android.com/studio |
| Expo Go (phone) | Latest | App Store / Play Store |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/4rCH133/Orca.git
cd Orca
```

### 2. Install dependencies

```bash
npm install
```

> Note: This project uses `legacy-peer-deps=true` in `.npmrc` — standard for React Native projects.

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
EXPO_PUBLIC_REDDIT_CLIENT_ID=your_reddit_client_id
EXPO_PUBLIC_REDDIT_REDIRECT_URI=orca://auth/callback
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_UPSTASH_REDIS_URL=https://your-db.upstash.io
EXPO_PUBLIC_UPSTASH_REDIS_TOKEN=your_upstash_token
```

See **Service Setup** below for how to get each of these.

### 4. Run in mock mode (no credentials needed)

Mock mode lets you develop and test the UI without any API keys.
It is enabled by default. To use it:

```bash
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `w` for browser.

To disable mock mode and use real Reddit data, open [src/dev/mockMode.ts](src/dev/mockMode.ts) and set:

```ts
export const MOCK_MODE = false;
```

---

## Service Setup

### Reddit API (required for real data)

1. Go to https://www.reddit.com/prefs/apps
2. Click **"create another app"**
3. Fill in:
   - **Name:** Orca
   - **Type:** installed app
   - **Redirect URI:** `orca://auth/callback`
4. Copy the **client ID** (string shown under "installed app")
5. Paste into `EXPO_PUBLIC_REDDIT_CLIENT_ID` in your `.env`

> Note: Reddit requires API access approval for new apps. Submit a request at https://support.reddithelp.com/hc/en-us/requests/new?ticket_form_id=14868593862164

### Supabase (required for cross-device sync)

1. Create a free project at https://supabase.com
2. Go to **SQL Editor** and run the full contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - anon/public key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Upstash Redis (required for API response caching)

1. Create a free Redis database at https://console.upstash.com
2. Go to **Details → REST API** and copy:
   - Endpoint → `EXPO_PUBLIC_UPSTASH_REDIS_URL`
   - Read/Write Token → `EXPO_PUBLIC_UPSTASH_REDIS_TOKEN`

---

## Project Structure

```
app/                        Expo Router screens (file = route)
├── (auth)/login.tsx        Login screen
├── (tabs)/
│   ├── home/index.tsx      Home feed with sort picker
│   ├── search/index.tsx    Global Reddit search
│   ├── likes.tsx           Upvoted + saved post search (offline)
│   ├── inbox/index.tsx     Inbox (Phase 4)
│   └── profile/index.tsx   User profile + karma
├── post/[id].tsx           Post detail + nested comments
└── _layout.tsx             Root layout

src/
├── api/
│   ├── reddit.ts           Reddit REST API client + TypeScript types
│   ├── auth.ts             OAuth2 PKCE flow + token refresh
│   └── queries/
│       ├── feed.ts         TanStack Query hooks for feeds
│       ├── post.ts         Post detail + subreddit info queries
│       └── interactions.ts Supabase sync hooks
├── components/
│   ├── feed/PostCard.tsx   Post card with vote + save buttons
│   ├── comments/           Nested comment thread with depth colours
│   └── ui/VoteButtons.tsx  Upvote/downvote with haptics
├── db/
│   ├── schema.ts           SQLite init + FTS5 virtual tables
│   └── likes.ts            Local liked/saved post CRUD + FTS search
├── dev/
│   ├── mockMode.ts         Toggle mock mode on/off
│   └── mockData.ts         Realistic fake posts + comments
├── lib/
│   ├── supabase.ts         Supabase client
│   └── redis.ts            Upstash Redis REST client + withCache()
├── store/
│   ├── authStore.ts        Auth state (Zustand)
│   └── settingsStore.ts    Theme + layout prefs (MMKV)
└── theme/
    ├── colors.ts           Orca colour system (OLED black base)
    └── typography.ts       Type scale + weights

supabase/
└── migrations/
    └── 001_initial_schema.sql   Full Postgres schema with RLS

docs/
└── PRD-v1.md               Product Requirements Document
```

---

## Running on Device / Simulator

### Expo Go (easiest — no build required)

Expo Go lets you run the app on your real phone instantly — no build, no App Store, no cables needed.

**Step 1 — Install Expo Go on your phone**
- iPhone: https://apps.apple.com/app/expo-go/id982107779
- Android: https://play.google.com/store/apps/details?id=host.exp.exponent

**Step 2 — Start the dev server on your computer**
```bash
npx expo start
```

**Step 3 — Connect your phone**
- iPhone: Open the default **Camera app**, point it at the QR code in the terminal — tap the banner that appears
- Android: Open **Expo Go**, tap **Scan QR code**, scan the QR code in the terminal

**Step 4 — The app loads on your phone**
Every time you save a file, the app hot-reloads automatically on your phone.

> Your phone and computer must be on the **same WiFi network**. If the QR code doesn't connect, press `s` in the terminal to switch to Expo tunnel mode.

### iOS Simulator (Mac only)
```bash
npx expo run:ios
```

### Android Emulator
```bash
# Requires Android Studio + AVD set up
npx expo run:android
```

### Web (Chrome DevTools iPhone simulation)
```bash
npx expo start --web
# Open http://localhost:8081
# F12 → device toolbar → select iPhone 15 Pro
```

---

## Building for App Stores

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project (first time only)
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to App Store + Play Store
eas submit --platform all
```

---

## Key Commands

```bash
npx expo start              # Start dev server
npx expo start --web        # Start web version
npm run type-check          # TypeScript check
npm run lint                # ESLint
npm run format              # Prettier
npm test                    # Jest tests
```

---

## Design System

Orca's visual identity is inspired by the orca: stark, intelligent, fast.

- **Background:** True OLED black `#000000`
- **Surface:** `#0D0D0E` / `#161617`
- **Text:** `#F0F0F0` (primary) → `#5A5A5C` (muted)
- **Accent:** Reddit orange `#FF4500` — used only for interactive actions
- **System fonts** only — zero loading latency

---

## Architecture Notes

**Liked/saved post search** is the signature feature. When a user upvotes or saves a post:
1. Immediately upserted into local SQLite FTS5 (< 5ms, works offline)
2. Asynchronously synced to Supabase for cross-device access

**Reddit API rate limits** (60 req/min) are handled by:
- Upstash Redis caching all responses (2–10 min TTL)
- TanStack Query `staleTime` preventing duplicate requests

---

## License

Business Source License 1.1 — see [LICENSE](LICENSE).
Source is visible for review. Commercial use restricted until 2030-03-24, after which it converts to MIT.
Contact: aragabih@hotmail.com for commercial licensing.
