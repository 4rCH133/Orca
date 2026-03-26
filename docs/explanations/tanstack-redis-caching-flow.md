# TanStack Query + Upstash Redis Caching Flow

Orca uses two independent caching layers to reduce calls to the Reddit API (rate limited to 60 req/min per OAuth token).

---

## The Two Layers

| Layer          | Where         | Survives app kill? | Shared across users? | Cost               |
| -------------- | ------------- | ------------------ | -------------------- | ------------------ |
| TanStack Query | Device memory | No                 | No                   | Zero               |
| Upstash Redis  | Upstash cloud | Yes                | Yes                  | Network round-trip |

They serve different purposes. TanStack prevents redundant calls **within an active session**. Redis catches **cold starts** and benefits **other users** requesting the same non-personalized content.

---

## Layer 1 — TanStack Query (in-memory, per-device)

TanStack is the first line of defence. Every feed and post query has a `staleTime` that controls how long cached data in memory is considered fresh.

```
Component mounts (or user navigates to screen)
  │
  ├─ Data in TanStack cache AND not stale?
  │    └─ YES → render immediately, no network call
  │
  └─ NO (cold start, or staleTime elapsed)
       └─ Fire queryFn → proceed to Layer 2
```

**Current staleTime values:**

| Query          | staleTime |
| -------------- | --------- |
| Home feed      | 2 min     |
| Subreddit feed | 2 min     |

---

## Layer 2 — Upstash Redis (cloud key-value store)

When TanStack decides a fetch is needed, the `queryFn` calls an API function (e.g. `getFeed()`) which wraps the Reddit call in `withCache()`. This checks Upstash before ever touching Reddit.

```
queryFn fires → getFeed() / getSubredditFeed() / getPost()
  │
  └─ withCache(key, fetcher, ttlSeconds)
       │
       ├─ GET key from Upstash
       │    │
       │    ├─ HIT  → return cached JSON
       │    │          Reddit never called
       │    │
       │    └─ MISS → call reddit.com
       │               └─ SET key EX ttlSeconds → Upstash (fire-and-forget)
       │                    └─ return fresh data
       │
       └─ If Upstash unreachable → fall through to reddit.com directly
```

Upstash enforces TTL expiry automatically server-side. No manual cleanup required.

---

## Cache Keys and TTLs

Each endpoint has a deterministic cache key so the same request always maps to same cached value. Page-2+ requests include the `after` cursor so each page is cached independently.

| Endpoint           | Cache Key Pattern           | Redis TTL | TanStack staleTime | Notes                                                                                                                                                                           |
| ------------------ | --------------------------- | --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home feed          | `feed:best:start`           | 120s ⚠️   | 120s (whole query) | Key is shared across all users — a different user's personalized feed can be returned on a cache hit. Should be scoped per username or removed from Redis entirely.             |
| Home feed (page 2) | `feed:best:t3_abc123`       | 120s ⚠️   | 120s (whole query) | Pages 2+ are part of the same `useInfiniteQuery` — staleTime governs all pages as a unit, not individually. Same Redis personalization problem as page 1.                       |
| Subreddit feed     | `sub:programming:hot:start` | 120s      | 120s               | Non-personalized — cross-user sharing is correct.                                                                                                                               |
| Post detail        | `post:abc123`               | 300s      | 300s               | Non-personalized — cross-user sharing is correct. TTL parity issue applies here too — both expire together, so Redis only helps other users, not the same user's re-navigation. |
| Subreddit info     | `subinfo:programming`       | 600s      | 600s               | Non-personalized — cross-user sharing is correct. Same TTL parity note as above.                                                                                                |

---

    NOTE: ⚠️ Indicating Home Feeds should not be cached in Redis as they are tailored to each individual user, and Redis is for impersonal cross-user data caching

    NOTE: We want to test staggering the TTL values between Redis and Tanstack in simulation or against mock API, get metrics, determine best solution, but matching TTLs should be best gambit.

## Full Request Decision Tree

```
User opens screen
       │
       ▼
TanStack cache warm & not stale?
       │
  YES ─┘ → render (zero network)
       │
  NO ──┘
       │
       ▼
withCache() → GET from Upstash
       │
  HIT ─┘ → TanStack stores result → render (one Upstash hop, no Reddit call)
       │
  MISS─┘
       │
       ▼
fetch reddit.com
       │
       ├─ SET result in Upstash (async, non-blocking)
       │
       └─ TanStack stores result → render
```

---

## Cross-User Cache Sharing

Because Redis is a shared cloud store, a cache write by User A benefits User B:

```
User A opens r/programming → Redis MISS → fetches Reddit → writes to Redis
                                                                    │
User B opens r/programming (within TTL) ───────────────────→ Redis HIT
                                                          Reddit never called
```

This is the primary value Redis adds over TanStack alone. It only applies to **non-personalized** endpoints (subreddit feeds, post detail, subreddit info).

> **Important:** The home feed (`/best`) is personalized by Reddit per OAuth token. Sharing that cache key across users would give User B User A's personalized feed. Feed cache keys should include the username if home feed Redis caching is kept.

---

## What Bypasses the Cache

Some endpoints never go through `withCache` — they hit Reddit directly every time:

| Endpoint             | Cached? | Why not                         |
| -------------------- | ------- | ------------------------------- |
| Voting (`/api/vote`) | No      | Write operation — must be live  |
| Saving (`/api/save`) | No      | Write operation — must be live  |
| Comment submission   | No      | Write operation — must be live  |
| Search (`/search`)   | No      | Query-specific, low repeat rate |
| `getMoreChildren`    | No      | Dynamic, depth-dependent        |

Pull-to-refresh passes `bypassCache = true` on `getFeed`, `getSubredditFeed`, and `getPost`, skipping both layers and forcing a fresh Reddit call.

---

## Known Issues

1. **TTL parity on feeds** — TanStack `staleTime` (120s) and Redis TTL (120s) are the same value. Both can expire together, meaning Redis provides no benefit over TanStack for the same user's own session on feed endpoints. Redis TTL should be longer (e.g. 5–10 min) so it reliably catches TanStack expiry.

2. **Personalized feed cache key** — `feed:best:start` is shared across all users. Any user's home feed populates this key, and another user's cold start would receive that cached personalized feed. The key should be scoped per user (e.g. `feed:best:start:username`), or home feed caching should be removed from Redis entirely.
