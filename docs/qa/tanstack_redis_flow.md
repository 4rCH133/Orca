Every TanStack queryFn call goes through Redis — but inconsistently across different query types.

The call chain for the home feed:

However there's an important inconsistency in the code — not all feeds use withCache:

| Query                                 | Goes through Redis?                  |
| ------------------------------------- | ------------------------------------ |
| `getFeed()` (home feed)               | ✅ Yes                               |
| `getPost()` (post detail)             | ✅ Yes                               |
| `getSubredditInfo()`                  | ✅ Yes                               |
| `getSubredditFeed()` (subreddit feed) | ❌ No — calls `redditFetch` directly |

So useSubredditFeed — used when browsing e.g. r/programming — bypasses Redis entirely and hits Reddit on every TanStack refetch. That's likely an oversight rather than intentional design, since it's the same type of data as the home feed.

---

<h2> Implemented Fix </h2>

The CacheKeys.subreddit entry already exists in redis.ts but doesn't account for pagination (after). I'll fix that and update getSubredditFeed() to match the same pattern as getFeed().

Two changes made:

`redis.ts` — CacheKeys.subreddit now includes after so each pagination page gets its own cache key (e.g. sub:programming:hot:start, sub:programming:hot:t3_abc123), matching the pattern used by `CacheKeys.feed`.

`reddit.ts` — `getSubredditFeed()` now mirrors `getFeed()` exactly: accepts `bypassCache = false`, wraps the fetch in withCache with a 120s TTL, and uses the corrected cache key.
