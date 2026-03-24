# Product Requirements Document — Orca v1.0
**Project:** Orca — Reddit Client for iOS & Android
**Version:** 1.0 (MVP)
**Date:** 2026-03-24
**Status:** Draft

---

## 1. Overview

Orca is a fast, feature-rich Reddit client for iOS and Android. It is not a new social network — it is a premium skin and power-user layer on top of Reddit's public API. The v1 goal is to ship a polished, stable app to both app stores with the core Reddit experience fully covered, plus three differentiating features that justify switching from the official app.

### Vision Statement
> "Reddit, the way it should feel."

### Success Metrics (v1)
| Metric | Target |
|--------|--------|
| App Store rating | ≥ 4.5 stars |
| Crash-free sessions | ≥ 99.5% |
| Cold start time | < 1.5 seconds |
| Feed scroll FPS | Locked 60fps |
| DAU/MAU retention | ≥ 40% at 30 days |

---

## 2. Target Users

| Persona | Description |
|---------|-------------|
| **Power Redditor** | Uses Reddit 30+ min/day, frustrated by official app ads and UI clutter |
| **Content Curator** | Saves and upvotes heavily, wants to find old liked posts fast |
| **Lurker** | Reads but rarely posts; wants clean, distraction-free reading |
| **Multi-community User** | Subscribes to 50+ subreddits, needs smart feed management |

---

## 3. Scope — What v1 Includes

### 3.1 Authentication
- [x] Reddit OAuth2 PKCE login (installed app flow)
- [x] Persistent sessions via SecureStore
- [x] Automatic token refresh
- [ ] Logout with full session clear

### 3.2 Home Feed
- [ ] Default feed (best/hot/new/top/rising) — infinite scroll
- [ ] Sort selector in header
- [ ] Feed layouts: Card, Compact, List (user setting)
- [ ] Inline image/GIF preview in card view
- [ ] Post vote buttons (upvote / downvote) directly in feed
- [ ] Save button in feed
- [ ] Mark posts as read on scroll (grays them out)
- [ ] Pull-to-refresh
- [ ] 60fps via FlashList

### 3.3 Post Detail
- [ ] Post content (selftext rendered as Markdown)
- [ ] Image/GIF/video viewer (full-screen tap)
- [ ] Reddit video playback (HLS)
- [ ] Comment thread (nested, collapsible)
- [ ] Vote on comments
- [ ] Load more comments / continue thread
- [ ] Share post (native share sheet)
- [ ] Post & comment awards display

### 3.4 Subreddit View
- [ ] Subreddit header (banner, icon, subscriber count, description)
- [ ] Subscribe/unsubscribe button
- [ ] Subreddit-level sort
- [ ] Subreddit rules (accessible from header)
- [ ] NSFW warning gate

### 3.5 Search (Reddit-wide)
- [ ] Global search: posts, subreddits, users
- [ ] Search within a subreddit
- [ ] Filter results by: time (hour/day/week/month/year), sort (relevance/new/top)
- [ ] Recent searches (stored locally)

### 3.6 ★ Liked/Saved Post Search (Differentiator #1)
This is Orca's signature feature — instant, offline-capable search of everything you've ever upvoted or saved.

- [ ] Sync upvoted + saved posts to local SQLite FTS5 index on login
- [ ] Background sync every 30 minutes when app is in foreground
- [ ] Sync to Supabase (cross-device availability)
- [ ] Search screen with tab: **Upvoted** | **Saved**
- [ ] Full-text search by: title, subreddit, author, flair
- [ ] Filter by subreddit (dropdown)
- [ ] Filter by date range (this week / this month / this year / all time)
- [ ] Sort results: Newest first / Highest voted / Most comments
- [ ] Tap result → opens post detail

### 3.7 Subscriptions & Custom Feeds (Differentiator #2)
- [ ] My Subreddits list (synced from Reddit)
- [ ] Pin favourite subreddits (reorderable)
- [ ] Create custom multi-feeds (combine multiple subreddits)
- [ ] Name, describe, and reorder custom feeds
- [ ] Feeds synced to Supabase (available on reinstall/new device)

### 3.8 User Profile
- [ ] View own profile (karma, avatar, cake day)
- [ ] View own post history
- [ ] View own comment history
- [ ] View upvoted posts
- [ ] View saved posts
- [ ] View hidden posts

### 3.9 Inbox
- [ ] Unread message count badge
- [ ] Comment replies
- [ ] Post replies
- [ ] Mentions
- [ ] Mark all read

### 3.10 Themes & Appearance (Differentiator #3)
- [ ] System / Light / Dark / OLED theme
- [ ] Reddit Orange accent or custom accent color (color picker)
- [ ] Font size adjustment (Small / Medium / Large)
- [ ] Compact subreddit icon style vs full banner
- [ ] Auto-hide header on scroll (toggle)
- [ ] Custom app icons (3 variants: light, dark, minimal)

### 3.11 Settings
- [ ] Account management (logout)
- [ ] Feed defaults (sort, layout)
- [ ] Content filters (blur NSFW, hide NSFW entirely)
- [ ] Autoplay videos (WiFi only / Always / Never)
- [ ] Notifications (comment replies, mentions)
- [ ] Cache management (clear image cache, size display)
- [ ] About / Version / Open source licenses

---

## 4. What v1 Excludes (Backlog)

| Feature | Reason for Deferral |
|---------|---------------------|
| Submit posts / comments | Increases moderation complexity |
| Direct messages (send) | Read-only DMs sufficient for v1 |
| Chat | High complexity, low MVP value |
| Mod tools | Small audience, high complexity |
| Cross-post / Share to subreddit | Post submission deferred |
| Reddit Coins / Awards (give) | API complexity |
| Push notifications | Needs backend worker, v2 |
| Offline reading mode | Nice to have, v2 |
| iPad-specific layout | v2 tablet optimization |
| Web (expo web) | Mobile-first, v2 |

---

## 5. Technical Architecture

### 5.1 Stack Summary

```
┌─────────────────────────────────────┐
│       React Native + Expo           │
│  (iOS App Store + Google Play)      │
├──────────────┬──────────────────────┤
│  TanStack    │  Zustand             │
│  Query       │  (local state)       │
│  (server     ├──────────────────────┤
│   cache)     │  MMKV                │
│              │  (settings/prefs)    │
├──────────────┴──────────────────────┤
│         Expo SQLite + FTS5          │
│    (local liked/saved post index)   │
├──────────────┬──────────────────────┤
│  Reddit API  │  Supabase            │
│  (OAuth2)    │  (user data, sync)   │
│              ├──────────────────────┤
│              │  Upstash Redis       │
│              │  (API response cache)│
└──────────────┴──────────────────────┘
```

### 5.2 Data Flow — Liked Posts Search

```
User Upvotes Post (Reddit API)
    │
    ├─→ Optimistic UI update
    │
    ├─→ SQLite FTS5 upsert (immediate, local)
    │
    └─→ Supabase post_interactions upsert (background, async)

User opens Likes search → hits SQLite first (< 5ms)
If online → Supabase RPC as fallback for cross-device results
```

### 5.3 Reddit API Rate Limit Strategy
- Reddit allows 60 req/min per OAuth token
- All feed queries are cached in Upstash Redis (TTL: 2min for feeds, 10min for subreddit info)
- TanStack Query `staleTime` prevents duplicate in-flight requests
- Background syncs (liked posts) are throttled to 1 request/2 seconds

---

## 6. Screen Map

```
/ (index) ─┬─ /(auth)/login
            └─ /(tabs)/
                ├─ home/           ← Feed + sort picker
                ├─ search/         ← Global Reddit search
                ├─ likes/          ← Upvoted + Saved post search ★
                ├─ inbox/          ← Replies + mentions
                └─ profile/        ← User profile + history

/r/[subreddit]         ← Subreddit view
/post/[id]             ← Post detail + comments
/user/[username]       ← Other user's profile
/settings/             ← Settings root
/settings/appearance   ← Themes, fonts, icons
/settings/feeds        ← Custom feeds manager
```

---

## 7. Design Principles

1. **Speed first** — Every list uses FlashList. Images lazy-load and are cached. Interactions are optimistic.
2. **Content-first UI** — Controls fade/minimize during scroll. Maximum reading area.
3. **Dark by default** — OLED-black default theme. True black (#000000) for OLED efficiency.
4. **Respect the API** — Cache aggressively. Never hammer Reddit's rate limit.
5. **Offline grace** — Liked/saved search works 100% offline via local SQLite.

---

## 8. Development Phases

### Phase 1 — Foundation (Sprint 1–2)
- Project setup ✓
- Auth flow (OAuth2 login/logout)
- Home feed (infinite scroll, FlashList)
- Post detail (text + comments)
- Basic navigation

### Phase 2 — Core Features (Sprint 3–4)
- Subreddit view
- Vote + save (optimistic)
- Image/GIF viewer
- Reddit video player
- Subscriptions sidebar

### Phase 3 — Differentiators (Sprint 5–6)
- Liked/saved post search (SQLite FTS5 + Supabase sync)
- Custom feeds
- Theme system (OLED/dark/light/custom accent)
- Settings screen

### Phase 4 — Polish & Launch (Sprint 7–8)
- Inbox
- User profile + history
- Performance audit (startup time, FPS profiling)
- Accessibility pass (VoiceOver / TalkBack)
- App Store screenshots + metadata
- EAS production build + submission

---

## 9. Third-Party Service Setup Checklist

| Service | Purpose | Action Required |
|---------|---------|-----------------|
| Reddit API | Core content | Create app at reddit.com/prefs/apps |
| Supabase | User data, cross-device sync | Create project at supabase.com, run migration |
| Upstash | Redis API cache | Create DB at console.upstash.com |
| Expo EAS | Build + OTA + submit | `eas login && eas build:configure` |
| Apple Developer | iOS distribution | Enroll at developer.apple.com ($99/yr) |
| Google Play Console | Android distribution | Create account at play.google.com/console ($25 one-time) |

---

## 10. Open Questions

1. **Monetization** — Free with no ads? Paid one-time? Subscription for cloud sync? → Decision needed before v1 launch.
2. **Username policy** — Do we need a custom Orca account system, or is Reddit identity sufficient?
3. **App name trademark** — Is "Orca" clear of conflicts?
4. **Reddit API Terms** — Confirm we are compliant with Reddit's API Terms of Service (no monetizing API data, rate limits respected, attribution displayed).

---

*Document owner: TBD | Next review: Sprint 1 kickoff*
