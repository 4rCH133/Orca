# Orca — Claude Code Project Guide

This file gives any Claude Code instance full context on the project so it can pick up immediately without re-discovery. Read this entire file before making any changes.

---

## What This Project Is

**Orca** is a premium Reddit client for iOS and Android. It is a frontend over the Reddit public API — not a new social network. The tagline is *"Reddit, the way it should feel."*

**Core differentiator:** Intelligent offline search of your own liked, saved, and commented posts via local SQLite FTS5. Instant results (<5ms), works offline, zero cloud cost. This is what makes Orca worth paying for.

**Mission:** "Get my info clear, cut, and to the point." Every design and feature decision serves this — fast access to the content you care about.

- **GitHub:** https://github.com/4rCH133/Orca
- **License:** BUSL-1.1 (source visible, commercial use restricted until 2030-03-24, then converts to MIT)
- **Contact:** aragabih@hotmail.com
- **Business model:** Freemium — see Freemium Feature Map below

---

## Tech Stack (do NOT suggest alternatives unless explicitly asked)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React Native + Expo SDK 54 | Single codebase, iOS + Android + web dev mode |
| Language | TypeScript (strict) | Type safety throughout |
| Navigation | Expo Router v6 (file-based) | Automatic deep links, web-compatible, Expo-native |
| Server state | TanStack Query v5 | Caching, infinite scroll, background refresh |
| Local state | Zustand v5 | Lightweight, no boilerplate, hooks-based |
| Fast storage | MMKV | Settings persistence, faster than AsyncStorage |
| Local search DB | Expo SQLite + FTS5 | Offline liked/saved post search — core feature |
| Backend DB | Supabase (PostgreSQL + RLS) | User data, cross-device sync |
| API cache | Upstash Redis (REST) | Reddit API response cache, rate-limit protection |
| Auth | expo-auth-session + Reddit OAuth2 PKCE | Token in SecureStore |
| List rendering | FlashList (Shopify) | 60fps feeds |
| Images | expo-image | Built-in caching |
| Icons | lucide-react-native | Clean stroke icons (MessageCircle, Share2, Settings, etc.) |
| Tab bar icons | Unicode geometry glyphs | `⌂ ⌕ ◆ ✉ ◉` — Orca's visual fingerprint |
| Bottom sheets | @gorhom/bottom-sheet | Industry-standard sheet surfaces |
| SVG | react-native-svg | Required by lucide-react-native |
| Animations | react-native-reanimated v4 + react-native-worklets | Smooth 60fps animations |
| Gestures | react-native-gesture-handler | Swipe, pan, pinch-to-zoom |
| Haptics | expo-haptics | Tactile feedback on votes |
| Styling | StyleSheet (native) | Direct token usage from theme system |
| Builds/CI | EAS (Expo Application Services) | Cloud builds, OTA updates, App Store submit |

---

## Architecture Decisions

### Why Zustand over Redux Toolkit
Zustand is simpler — no action creators, no reducers, no middleware boilerplate. TanStack Query handles all server state; Zustand only manages UI state (auth, settings). Together they're a cleaner separation than Redux Toolkit + RTK Query.

### Why TanStack Query over RTK Query
Better `useInfiniteQuery` for feed pagination, simpler cache invalidation with query keys, and it's framework-agnostic. RTK Query requires Redux — unnecessary overhead when Zustand covers local state.

### Why Expo Router over React Navigation
Expo Router IS React Navigation under the hood, but with file-based routing. A file in `app/` = a route. Automatic deep links, web compatibility, and no manual navigator configuration. It's the Expo-native way.

### Why SQLite FTS5 over Elasticsearch
Free, offline, instant (<5ms queries), zero infrastructure cost. Elasticsearch requires $95+/mo hosting and a custom backend. SQLite FTS5 handles the core use case (searching your own posts). If scale demands it later, Supabase PostgreSQL full-text search is the cloud fallback — not Elasticsearch.

### Why Supabase over a custom backend
Supabase provides PostgreSQL + Row Level Security + real-time subscriptions + auto-generated TypeScript types with zero backend code to maintain. A custom Node.js/Express server adds complexity with no user-facing benefit at this stage.

### No client_secret
This is a Reddit "installed app" (mobile). There is no `client_secret`. The Authorization header uses `btoa(clientId + ':')` (empty password).

### Dual-layer liked/saved post search
The signature feature. When a user upvotes or saves a post:
1. **Immediately** upserted into local SQLite FTS5 table (`liked_posts` / `saved_posts`) — <5ms, works offline
2. **Asynchronously** synced to Supabase `post_interactions` table — cross-device access

Search hits SQLite first. Supabase is the cloud fallback.

### API rate limit strategy
Reddit allows 60 req/min. All Reddit API responses are cached in Upstash Redis:
- Feeds: 2-minute TTL
- Subreddit info: 10-minute TTL
- Post detail: 5-minute TTL

TanStack Query `staleTime` prevents duplicate in-flight requests on the client. Rate limit headers (`X-Ratelimit-Remaining`) are parsed and stored in `rateLimitStore`.

---

## Epic Backlog (11 Epics, 38 Stories)

Full epic documents are in `C:\Users\araga\Downloads\Orca Epics\`. Each epic file is self-contained with acceptance criteria, test cases, and implementation guidance. The epics originally specified Redux/RTK Query/React Navigation/Elasticsearch — all features are adapted to the current stack (Zustand/TanStack Query/Expo Router/Supabase/SQLite).

| # | Epic | Stories | Status | Stack Adaptation |
|---|------|---------|--------|-----------------|
| 1 | Foundation & Auth | 7 | ✅ Done | Zustand replaces Redux, TanStack Query replaces RTK Query, Supabase replaces custom backend |
| 2 | Feed & Post Display | 4 | 🔷 Next | FlashList + TanStack Query infinite scroll |
| 3 | Comments & Interaction | 5 | Planned | Swipe gestures, comment composer, voting |
| 4 | Search & Content Management | 4 | Planned | SQLite FTS5 replaces Elasticsearch. Smart Search (Discover/Mine dual mode) |
| 5 | Media & Performance | 3 | Planned | expo-av + expo-image, offline caching |
| 6 | Profiles & Social | 3 | Planned | User profiles, inbox, multi-account |
| 7 | Accessibility | 4 | Planned | Screen reader, dyslexia fonts, color blindness, motion |
| 8 | AI Features | 3 | Planned | Thread summarization, smart notifications (may use Claude API) |
| 9 | Post Creation & Moderation | 2 | Planned | Post composer, mod tools |
| 10 | Settings, Onboarding, Polish | 5 | Planned | Settings screen, subscriptions, widgets, deep links |
| 11 | Privacy & Compliance | 2 | Planned | Zero trackers, GDPR/CCPA (already zero-tracker by default) |

### Implementation Phases

| Phase | Epics | What Gets Built |
|-------|-------|----------------|
| 1 | E1 + E11 | ✅ App boots, authenticates, navigates, themes switch |
| 2 | E2 + E3 | Feed infinite scroll, 4 view modes, post detail, threaded comments, voting, swipe gestures |
| 3 | E4 + E5 | Smart Search (Discover/Mine dual mode), media player, offline mode |
| 4 | E6 + E7 | Profiles, user tagging, accessibility (WCAG), inbox |
| 5 | E8 + E9 | AI features (thread summaries), post composer, mod tools |
| 6 | E10 | Settings, onboarding, widgets, subscriptions, deep links |

---

## Freemium Feature Map

| Feature | Free | Premium ($4.99/mo) |
|---------|------|-------------------|
| Browse Reddit (feed, posts, comments) | ✅ | ✅ |
| Global Reddit search | ✅ | ✅ |
| Classic view mode | ✅ | ✅ |
| Light + Dark themes | ✅ | ✅ |
| All 4 view modes (card, compact, list, gallery) | ❌ | ✅ |
| Custom accent colors | ❌ | ✅ |
| Swipe gesture customization | ❌ | ✅ |
| Personal search (SQLite FTS5 — offline, instant) | ❌ | ✅ |
| Saved post folders & tags | ❌ | ✅ |
| Content filtering engine | ❌ | ✅ |
| AI thread summarization | ❌ | ✅ |
| Smart notifications | ❌ | ✅ |
| Offline mode | ❌ | ✅ |
| Home screen widgets | ❌ | ✅ |
| Export (MD/CSV/JSON) | ❌ | ✅ |
| New comment highlighting | ❌ | ✅ |
| User tagging (RES-style) | ❌ | ✅ |

---

## Design System

Orca's visual identity is inspired by the orca: calm, intelligent, fast. Matte deep-sea tones, easy on the eyes.

### Color Palette (Dark theme — default)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg.base` | `#0D1117` | Screen background (matte midnight) |
| `bg.surface` | `#161B22` | Cards, sheets |
| `bg.elevated` | `#1C2128` | Modals, popovers |
| `bg.input` | `#21262D` | Input fields, search bar |
| `bg.subtle` | `#262C36` | Dividers, skeleton fills |
| `text.primary` | `#E6EDF3` | Body text |
| `text.secondary` | `#8B949E` | Metadata, timestamps, author |
| `text.muted` | `#484F58` | Placeholders, disabled |
| `accent.ocean` | `#3B9FD4` | Primary interactive — tabs, links, focus |
| `accent.oceanDeep` | `#1F6B9A` | Pressed states |
| `accent.orange` | `#FF4500` | Upvotes ONLY — Reddit orange |
| `accent.downvote` | `#5B8AF0` | Downvotes — periwinkle blue |
| `accent.save` | `#F0C040` | Saved/bookmarked posts — warm gold |
| `accent.green` | `#3FB950` | OP badge, success |
| `border.default` | `#30363D` | Card borders |
| `border.focus` | `#3B9FD4` | Input focus ring |
| `depth[0-5]` | 6 ocean shades | Comment thread indent lines |

### Visual Identity (NOT Reddit)

| Element | Orca | Reddit |
|---------|------|--------|
| Vote buttons | `+` / `−` pill buttons | ▲▼ arrows |
| Tab bar | Unicode glyphs `⌂ ⌕ ◆ ✉ ◉` | Text + flat icons |
| Primary color | Ocean blue | Heavy orange |
| Save icon | `◇` / `◆` diamond | Bookmark |
| Action icons | lucide-react-native (MessageCircle, Share2, etc.) | Emoji/custom |
| Sort picker | Horizontal chip pills (always visible) | Dropdown modal |
| Sheets | Custom dark navy @gorhom/bottom-sheet | Standard action sheet |

---

## Project Structure

```
app/                          Expo Router screens (file = route)
├── (auth)/login.tsx          Login screen
├── (tabs)/
│   ├── _layout.tsx           Tab navigator (Home, Search, Likes, Inbox, Profile)
│   ├── home/index.tsx        Home feed with sort pills + FlashList
│   ├── search/index.tsx      Search screen
│   ├── likes.tsx             Liked/saved post search (offline FTS5)
│   ├── inbox/index.tsx       Inbox (placeholder)
│   └── profile/index.tsx     User profile + karma
├── post/[id].tsx             Post detail + nested comments
├── r/[subreddit]/index.tsx   Subreddit view
├── _layout.tsx               Root: QueryClient, GestureHandler, ThemeProvider, auth init
└── index.tsx                 Auth guard redirect

src/
├── api/
│   ├── reddit.ts             Reddit REST API client + all TypeScript types
│   ├── auth.ts               OAuth2 PKCE flow, token refresh, SecureStore
│   └── queries/
│       ├── feed.ts           useHomeFeed, useSubredditFeed, useVotePost, useSavePost
│       ├── post.ts           usePost, useSubredditInfo
│       └── interactions.ts   Supabase sync hooks
├── components/
│   ├── feed/PostCard.tsx     Post card (title-first, thumbnail right, vote + save footer)
│   ├── comments/CommentThread.tsx  Recursive nested comments with depth colors
│   └── ui/VoteButtons.tsx    + / − pill buttons with haptics
├── db/
│   ├── schema.ts             SQLite init + FTS5 virtual tables (liked_posts, saved_posts)
│   └── likes.ts              CRUD + FTS search for local posts
├── dev/
│   ├── mockMode.ts           Toggle MOCK_MODE on/off (no credentials needed)
│   ├── mockData.ts           Realistic fake posts + comments + user
│   └── index.ts              Barrel export
├── lib/
│   ├── supabase.ts           Supabase client singleton
│   ├── supabase.types.ts     TypeScript DB types
│   └── redis.ts              Upstash Redis REST client + withCache() + CacheKeys
├── store/
│   ├── authStore.ts          Zustand: user, isAuthenticated, login, logout, initialize
│   ├── settingsStore.ts      Zustand + MMKV: theme, feedLayout, autoPlayVideos, blurNSFW
│   └── rateLimitStore.ts     Zustand: Reddit API rate limit tracking
├── theme/
│   ├── colors.ts             Color tokens (dark + light palettes)
│   ├── typography.ts         Type scale + system fonts
│   ├── tokens.ts             ThemeTokens type + theme definitions
│   ├── ThemeProvider.tsx      React context for theme switching
│   └── useTheme.ts           useTheme() hook
└── utils/
    └── format.ts             formatScore(), formatTimeAgo()

supabase/
└── migrations/
    └── 001_initial_schema.sql   Users, preferences, post_interactions, subscriptions, custom_feeds + RLS

docs/
└── PRD-v1.md                 Product Requirements Document
```

---

## Environment Variables

All prefixed `EXPO_PUBLIC_` to be accessible in React Native. See `.env.example`:

```
EXPO_PUBLIC_REDDIT_CLIENT_ID       Reddit installed app client ID
EXPO_PUBLIC_REDDIT_REDIRECT_URI    orca://auth/callback
EXPO_PUBLIC_SUPABASE_URL           Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY      Supabase anon/public key
EXPO_PUBLIC_UPSTASH_REDIS_URL      Upstash Redis REST URL
EXPO_PUBLIC_UPSTASH_REDIS_TOKEN    Upstash Redis REST token
```

Copy `.env.example` → `.env` and fill in values. Mock mode (`MOCK_MODE = true` in `src/dev/mockMode.ts`) lets you develop without any credentials.

---

## Commands

```bash
npm install                  # Install dependencies (uses legacy-peer-deps via .npmrc)
npx expo start               # Start Metro — scan QR with Expo Go
npx expo start --clear       # Start with clean Metro cache (fixes stale module errors)
npx expo start --web         # Web mode (Chrome DevTools → device toolbar → iPhone)
npx expo run:ios             # iOS simulator (Mac only)
npx expo run:android         # Android emulator (requires Android Studio + AVD)

npm run type-check           # TypeScript strict check
npm run lint                 # ESLint
npm run format               # Prettier
npm test                     # Jest

eas build --platform all     # Cloud build for both platforms
eas submit --platform all    # Submit to App Store + Play Store
eas update                   # Push OTA update
```

---

## Auth Flow

Reddit "installed app" OAuth2 (no client secret):

1. User taps "Continue with Reddit" on login screen
2. `expo-auth-session` opens Reddit OAuth authorize URL in system browser
3. Scopes: `identity, read, vote, save, history, mysubreddits, subscribe, submit, edit, privatemessages, report`
4. Reddit redirects to `orca://auth/callback` deep link with authorization code
5. App exchanges code for access + refresh tokens (POST `/api/v1/access_token` with Basic auth)
6. Both tokens stored in `expo-secure-store` (encrypted)
7. On app start, `authStore.initialize()` checks for stored token, refreshes if expired
8. `redditFetch()` attaches `Bearer <token>` header to all API calls
9. 401 response → `TOKEN_EXPIRED` error → auth store handles refresh

---

## What NOT to Do

- Do NOT switch to Redux Toolkit or RTK Query — Zustand + TanStack Query is the architecture
- Do NOT add a custom backend server — Supabase + Reddit API is sufficient
- Do NOT add Elasticsearch — SQLite FTS5 for local search
- Do NOT use `FlatList` — always use `FlashList` for lists
- Do NOT use `AsyncStorage` — use MMKV for settings
- Do NOT use `axios` — native `fetch` only (works in RN + Expo)
- Do NOT commit `.env` — only `.env.example`
- Do NOT add `client_secret` — this is a mobile installed app, no secret
- Do NOT use hardcoded hex colors — use `colors.*` tokens or `useTheme()` hook
- Do NOT skip `staleTime` on TanStack Query hooks — Reddit rate limit is 60 req/min
- Do NOT use React Navigation directly — use Expo Router (file-based routing)
- Do NOT import from `react-native-reanimated` without also having `react-native-worklets` installed (SDK 54 requirement)

---

## Git Workflow

- Branch naming: `feat/feature-name`, `fix/bug-name`, `chore/task-name`
- Commit style: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Main branch: `main`
- Never force-push to `main`
