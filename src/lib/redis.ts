/**
 * Upstash Redis client — REST-based, works in React Native without native modules.
 *
 * Used for:
 * - Caching Reddit API responses (avoid rate limits)
 * - Rate limiting per user
 * - Storing trending/popular subreddits
 *
 * Fault-tolerant: all operations silently fail if Redis is not configured
 * or unreachable. The app falls through to direct API calls.
 */

const UPSTASH_URL = process.env.EXPO_PUBLIC_UPSTASH_REDIS_URL;
const UPSTASH_TOKEN = process.env.EXPO_PUBLIC_UPSTASH_REDIS_TOKEN;
const isConfigured = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

async function redisCommand(command: string[]): Promise<unknown> {
  if (!isConfigured) return null;

  const response = await fetch(UPSTASH_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) throw new Error(`Redis error: ${response.status}`);
  const { result } = await response.json();
  return result;
}

export const redis = {
  async get<T>(key: string): Promise<T | null> {
    const result = await redisCommand(['GET', key]);
    if (!result) return null;
    return JSON.parse(result as string) as T;
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const cmd = ['SET', key, JSON.stringify(value)];
    if (ttlSeconds) cmd.push('EX', String(ttlSeconds));
    await redisCommand(cmd);
  },

  async del(key: string): Promise<void> {
    await redisCommand(['DEL', key]);
  },

  async incr(key: string): Promise<number> {
    return (await redisCommand(['INCR', key])) as number;
  },

  async expire(key: string, seconds: number): Promise<void> {
    await redisCommand(['EXPIRE', key, String(seconds)]);
  },
};

// ---- Cache helpers ----

/**
 * Cache a Reddit API response for `ttl` seconds.
 * Falls through to direct fetch if Redis is not configured or errors.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 120
): Promise<T> {
  if (!isConfigured) return fetcher();

  // Try to read from cache
  try {
    const cached = await redis.get<T>(key);
    if (cached) return cached;
  } catch {
    // Redis read failed — proceed to fetch
  }

  // Fetch fresh data
  const data = await fetcher();

  // Write to cache (fire-and-forget, non-blocking)
  redis.set(key, data, ttlSeconds).catch(() => {});

  return data;
}

export const CacheKeys = {
  feed: (sort: string, after?: string) => `feed:${sort}:${after ?? 'start'}`,
  subreddit: (sub: string, sort: string) => `sub:${sub}:${sort}`,
  post: (id: string) => `post:${id}`,
  subredditInfo: (sub: string) => `subinfo:${sub}`,
  userSaved: (username: string) => `saved:${username}`,
};
