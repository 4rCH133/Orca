<h1> Problem: </h1>

Both the feed's TanStack staleTime and the Redis TTL are set to 120 seconds. They're independent timers that aren't synchronized. When TanStack expires and triggers a refetch, Redis may have also already expired — meaning neither cache helps and Reddit is called anyway. If Redis TTL were significantly longer (e.g. 5–10 min) than staleTime (2 min), Redis would reliably serve as the second layer. As written, they can expire roughly together and the Redis layer provides little benefit over TanStack alone.

For a single-user mobile app, TanStack alone handles ~95% of the rate-limit problem within a session. The only real unique value Redis adds is:

- Cross-user cache sharing (minimal for a personal client)
- Persistence across cold starts
- A simpler and more correct alternative would be TanStack + @tanstack/query-async-storage-persister (disk persistence), which would survive app kills without the added network hop to Upstash and without the token exposure risk.

So: not redundant in theory, but misconfigured enough that in practice it often is.

<h1> Solution: </h1>

The canonical layered cache design is: L1 short-lived → L2 longer-lived → origin. This is how CDN + browser cache works, how most API caching works. The design intent is:

TanStack prevents duplicate calls within an active session (most valuable, zero network cost)

When TanStack expires, Redis catches it and buys more time before Reddit is hit

Reddit is only called when both caches miss

On staleness: for a Reddit client specifically, how bad is 4-minute-old data on a post detail? Score counts and comment counts are already eventually consistent on Reddit's own servers. The bypassCache = true flag already exists on getPost() and getFeed() for pull-to-refresh, giving users an explicit escape hatch when they want fresh data.

Redis TTL of 5-10 min vs TanStack staleTime of 2 min is the correct approach. Scenario A trades reliable cache benefit for unreliable cross-user luck while increasing Reddit API call rate.
