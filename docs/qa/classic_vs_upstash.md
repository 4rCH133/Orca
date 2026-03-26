<h1>Is Upstash worth it vs. self-hosted?</h1>

For this app specifically: almost certainly yes, keep Upstash.

<h2>The math on self-hosting works against you here:</h2>

Upstash Self-hosted (e.g. GKE + Redis)
Fixed monthly cost ~$0 (free tier: 10k req/day) ~$50-150/mo minimum (cluster overhead, load balancer, persistent disk)
Ops burden Zero Patching, scaling, monitoring, failover
Latency ~10-30ms (edge nodes) Comparable or worse unless you colocate regions
Break-even user count N/A Thousands of DAU to justify
Kubernetes adds significant operational complexity (node pools, autoscaler tuning, pod disruption budgets) that is engineering time you'd be spending instead of building product. The free tier on Upstash likely covers this app until it has meaningful traction, and paid Upstash tiers (~$0.20/100k requests) are still cheaper than self-hosted until you're at substantial scale.

The only scenario where self-hosted wins is if you already have a Kubernetes cluster running other services — then adding Redis as a deployment is near-zero marginal cost.

<h3>Other options:</h3>

Option Fit for this use case
| Option | Fit for this use case |
|--------|----------------------|
| TanStack persister (@tanstack/query-async-storage-persister) | Best simple alternative — persists TanStack cache to device disk via AsyncStorage/MMKV. Survives cold starts, zero network cost, zero cloud cost. Covers the main Redis benefit for single-user cold-start scenario. |
| Cloudflare KV | Similar REST-based key-value store, generous free tier, lower latency on edge. Viable Redis replacement with same architecture. |
| Cloudflare Cache API (via Workers) | Proper HTTP caching layer in front of Reddit — eliminates the client-side cache-writing pattern entirely. More correct architecture but requires a Workers deployment. |
| Supabase (already in stack) | Could store cached responses in a Postgres table with a cached_at timestamp. Worse performance than Redis but no new service. Pragmatic for a small app. |
| Nothing / TanStack only | Entirely reasonable for a v1. Reddit's own rate limit is per-token (per user), so a single user is unlikely to hit 60 req/min in normal browsing. Redis is protecting against a problem that may not exist at this scale. |

---

**Honest recommendation**: For a pre-launch app, drop Redis entirely and use the TanStack MMKV persister for cold-start caching. It solves the same problem with less complexity, no token exposure risk, no network hop, and no cost. Reintroduce Redis (or Cloudflare KV) if and when you have enough concurrent users that cross-user cache sharing becomes measurably valuable.

tl;dr only enable upstash when concurrent users exceeds certain number
TODO: WE NEED A FORMULA THAT IDENTIFIES THE COST-BENEFIT THRESHOLD FOR DEFFERING TO UPSTASH
