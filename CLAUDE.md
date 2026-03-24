# Orca — Claude Code Project Guide

This file gives any Claude Code instance full context on the project so it can pick up immediately without re-discovery.

---

## What This Project Is

**Orca** is a Reddit client app for iOS and Android. It is a premium skin/frontend over the Reddit public API — not a new social network. The tagline is *"Reddit, the way it should feel."*

GitHub: https://github.com/4rCH133/Orca

---

## Tech Stack (do not suggest alternatives unless asked)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React Native + Expo SDK 52 | Single codebase, iOS + Android |
| Language | TypeScript (strict) | Type safety throughout |
| Navigation | Expo Router v4 (file-based) | Automatic deep links, web-compatible |
| Server state | TanStack Query v5 | Caching, infinite scroll, background refresh |
| Local state | Zustand v5 | Lightweight, no boilerplate |
| Fast storage | MMKV | Settings persistence, faster than AsyncStorage |
| Local search DB | Expo SQLite + FTS5 | Offline liked/saved post search — core feature |
| Backend DB | Supabase (PostgreSQL) | User data, cross-device sync, RLS |
| API cache | Upstash Redis (REST) | Reddit API response cache, rate-limit protection |
| Auth | expo-auth-session + Reddit OAuth2 PKCE | Token in SecureStore |
| List rendering | FlashList (Shopify) | 60fps feeds |
| Images | expo-image | Built-in caching |
| Styling | NativeWind v4 (Tailwind CSS) | Utility-first, consistent |
| Builds/CI | EAS (Expo Application Services) | Cloud builds, OTA updates, app store submit |

---

## Project Structure

```
app/                    Expo Router screens (file = route)
  (auth)/               Unauthenticated screens
  (tabs)/               Tab navigator (home, search, likes, inbox, profile)
  r/[subreddit]/        Subreddit view
  post/[id]/            Post detail + comments
  _layout.tsx           Root layout: QueryClient, GestureHandler, auth guard
  index.tsx             Redirect: → login or → home based on auth state

src/
  api/
    reddit.ts           Reddit REST API client + all TypeScript types
    auth.ts             OAuth2 PKCE flow, token refresh, SecureStore
    queries/
      feed.ts           TanStack Query hooks: useHomeFeed, useSubredditFeed, useVotePost, useSavePost
      interactions.ts   Supabase hooks: useSearchInteractions, useUpsertInteraction, useUserPreferences
  db/
    schema.ts           SQLite database init + FTS5 virtual tables (liked_posts, saved_posts)
    likes.ts            CRUD + FTS search functions for local liked/saved posts
  lib/
    supabase.ts         Supabase client (singleton)
    supabase.types.ts   TypeScript types for DB schema (regen with: npx supabase gen types typescript --local)
    redis.ts            Upstash Redis REST client + withCache() helper + CacheKeys
  store/
    authStore.ts        Zustand: user, isAuthenticated, login, logout, initialize
    settingsStore.ts    Zustand + MMKV: theme, feedLayout, autoPlayVideos, blurNSFW
  types/
    index.ts            Re-exports + app-specific types

supabase/
  migrations/
    001_initial_schema.sql  Full Postgres schema: users, preferences, post_interactions, subscriptions, custom_feeds

docs/
  PRD-v1.md             Full Product Requirements Document for v1 MVP
```

---

## Key Architectural Decisions

### 1. Dual-layer liked/saved post search
The signature feature. When a user upvotes or saves a post:
1. **Immediately** upserted into local SQLite FTS5 table (`liked_posts` / `saved_posts`)
2. **Asynchronously** synced to Supabase `post_interactions` table

Search hits SQLite first (< 5ms, works offline). Supabase is used for cross-device queries.

### 2. API Rate Limit Strategy
Reddit allows 60 req/min. All Reddit API responses are cached in Upstash Redis:
- Feeds: 2-minute TTL
- Subreddit info: 10-minute TTL
- Post detail: 5-minute TTL

TanStack Query `staleTime` prevents duplicate in-flight requests on the client.

### 3. Auth flow
Reddit uses installed-app OAuth2 (no client secret). Flow:
1. `expo-auth-session` opens Reddit OAuth in a browser
2. Redirect to `orca://auth/callback` deep link
3. Token exchanged for access + refresh tokens
4. Both stored in `expo-secure-store`
5. `authStore.initialize()` runs on app start, refreshes token if needed

### 4. No client secret
This is a **mobile installed app** on Reddit. There is no `client_secret`. The `Authorization` header uses `btoa(clientId + ':')` (empty password).

---

## Environment Variables

All prefixed `EXPO_PUBLIC_` to be accessible in RN code. See `.env.example`:

```
EXPO_PUBLIC_REDDIT_CLIENT_ID       Reddit installed app client ID
EXPO_PUBLIC_REDDIT_REDIRECT_URI    orca://auth/callback
EXPO_PUBLIC_SUPABASE_URL           Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY      Supabase anon/public key
EXPO_PUBLIC_UPSTASH_REDIS_URL      Upstash Redis REST URL
EXPO_PUBLIC_UPSTASH_REDIS_TOKEN    Upstash Redis REST token
```

Copy `.env.example` → `.env` and fill in values before running.

---

## Running the Project

### Prerequisites
- Node.js 20+ LTS
- Java JDK 17 (for Android)
- Android Studio (for Android emulator)
- Expo Go app on physical device (easiest for initial testing)

### Commands
```bash
npm install          # Install dependencies (first time)
npx expo start       # Start Metro bundler — scan QR with Expo Go
npx expo run:ios     # Run on iOS simulator (Mac only)
npx expo run:android # Run on Android emulator

eas build --platform all       # Cloud build for both platforms
eas submit --platform all      # Submit to App Store + Play Store
eas update                     # Push OTA update
```

### Supabase Setup
1. Create project at supabase.com
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Copy project URL + anon key to `.env`
4. Regenerate TS types: `npx supabase gen types typescript --local > src/lib/supabase.types.ts`

### Upstash Setup
1. Create Redis database at console.upstash.com
2. Copy REST URL + token to `.env`

---

## Colors & Theme

```
Reddit orange:  #FF4500
Dark bg:        #1A1A1B
Elevated dark:  #272729
Border dark:    #343536
Text primary:   #D7DADC
Text muted:     #818384
OLED black:     #000000
```

Tailwind config: `tailwind.config.js` — custom `reddit.*` and `surface.*` color tokens.

---

## PRD Reference

Full requirements are in [docs/PRD-v1.md](docs/PRD-v1.md).

**v1 MVP phases:**
- Phase 1 (Sprint 1–2): Auth + home feed + post detail + navigation
- Phase 2 (Sprint 3–4): Subreddit view + voting/saving + media viewer
- Phase 3 (Sprint 5–6): Liked/saved search + custom feeds + themes
- Phase 4 (Sprint 7–8): Inbox + profile + polish + App Store submission

**Current status:** Phase 1 — foundation scaffolded, implementing auth flow.

---

## What NOT to Do

- Do not add a backend server/API (Supabase + Reddit API is sufficient)
- Do not use `FlatList` — always use `FlashList` for lists
- Do not use `AsyncStorage` for settings — use MMKV
- Do not skip `staleTime` on queries — Reddit has strict rate limits
- Do not commit `.env` — only `.env.example`
- Do not use `axios` — native `fetch` only (works in RN + Expo)
- Do not add a `client_secret` — this is a mobile installed app

---

## Git Workflow

Branch naming: `feat/feature-name`, `fix/bug-name`, `chore/task-name`
Commit style: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
Main branch: `main`
