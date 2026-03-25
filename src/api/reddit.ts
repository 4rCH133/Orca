/**
 * Reddit API client — thin wrapper around the OAuth REST API.
 * Uses TanStack Query for caching; raw fetches go through this client.
 *
 * 401 handling: automatically refreshes token + retries once (mutex-guarded).
 * Rate limit headers parsed on every response and stored in rateLimitStore.
 * Redis caching via withCache() for feeds, posts, subreddit info.
 */

import { useRateLimitStore } from '@/store/rateLimitStore';
import { useAuthStore } from '@/store/authStore';
import { refreshAccessToken } from '@/api/auth';
import { withCache, CacheKeys } from '@/lib/redis';

let accessToken: string | null = null;

// Mutex: ensures only one token refresh runs at a time across concurrent 401s
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

async function redditFetch<T>(path: string, options?: RequestInit, _isRetry = false): Promise<T> {
  const response = await fetch(`https://oauth.reddit.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Orca/1.0.0 (by /u/4rCH133)',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  // Parse rate limit headers from every response (including 401s)
  const rlRemaining = response.headers.get('X-Ratelimit-Remaining');
  const rlUsed = response.headers.get('X-Ratelimit-Used');
  const rlReset = response.headers.get('X-Ratelimit-Reset');
  if (rlRemaining != null) {
    useRateLimitStore.getState().update(
      Math.floor(Number(rlRemaining)),
      Number(rlUsed),
      Number(rlReset),
    );
  }

  // 401: auto-refresh token and retry once
  if (response.status === 401) {
    if (_isRetry) {
      // Already retried once — give up, log out
      useAuthStore.getState().logout();
      throw new Error('SESSION_EXPIRED');
    }

    // Mutex: if another call is already refreshing, reuse that promise
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (!newToken) {
      useAuthStore.getState().logout();
      throw new Error('SESSION_EXPIRED');
    }

    setAccessToken(newToken);
    return redditFetch<T>(path, options, true);
  }

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  return response.json();
}

// ---- Posts ----

export type FeedSort = 'best' | 'hot' | 'new' | 'top' | 'rising';
export type TopTimeframe = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

export async function getFeed(
  sort: FeedSort = 'best',
  after?: string,
  limit = 25,
  bypassCache = false,
) {
  const fetcher = () => redditFetch<RedditListing>(
    `/${sort}?limit=${limit}${after ? `&after=${after}` : ''}`
  );
  if (bypassCache) return fetcher();
  return withCache(CacheKeys.feed(sort, after), fetcher, 120);
}

export async function getSubredditFeed(
  subreddit: string,
  sort: FeedSort = 'hot',
  after?: string,
  limit = 25
) {
  return redditFetch<RedditListing>(
    `/r/${subreddit}/${sort}?limit=${limit}${after ? `&after=${after}` : ''}`
  );
}

export async function getPost(postId: string, bypassCache = false) {
  const fetcher = () => redditFetch<[RedditListing, RedditListing]>(`/comments/${postId}?limit=200`);
  if (bypassCache) return fetcher();
  return withCache(CacheKeys.post(postId), fetcher, 300);
}

export async function votePost(id: string, direction: 1 | 0 | -1) {
  return redditFetch('/api/vote', {
    method: 'POST',
    body: new URLSearchParams({ id: `t3_${id}`, dir: String(direction) }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

export async function savePost(id: string, save: boolean) {
  return redditFetch(`/api/${save ? 'save' : 'unsave'}`, {
    method: 'POST',
    body: new URLSearchParams({ id: `t3_${id}` }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

// ---- Search ----

export async function searchReddit(query: string, after?: string, limit = 25) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    type: 'link,sr,user',
    ...(after && { after }),
  });
  return redditFetch<RedditListing>(`/search?${params}`);
}

export async function searchSubreddit(subreddit: string, query: string, after?: string) {
  const params = new URLSearchParams({ q: query, limit: '25', restrict_sr: 'true', ...(after && { after }) });
  return redditFetch<RedditListing>(`/r/${subreddit}/search?${params}`);
}

// ---- User ----

export async function getMe() {
  return redditFetch<RedditUser>('/api/v1/me');
}

export async function getSavedPosts(username: string, after?: string, limit = 25) {
  return redditFetch<RedditListing>(
    `/user/${username}/saved?type=links&limit=${limit}${after ? `&after=${after}` : ''}`
  );
}

export async function getUpvotedPosts(username: string, after?: string, limit = 25) {
  return redditFetch<RedditListing>(
    `/user/${username}/upvoted?type=links&limit=${limit}${after ? `&after=${after}` : ''}`
  );
}

export async function getDownvotedPosts(username: string, after?: string, limit = 25) {
  return redditFetch<RedditListing>(
    `/user/${username}/downvoted?type=links&limit=${limit}${after ? `&after=${after}` : ''}`
  );
}

// ---- Subreddits ----

export async function getMySubreddits(after?: string) {
  return redditFetch<RedditListing>(
    `/subreddits/mine/subscriber?limit=100${after ? `&after=${after}` : ''}`
  );
}

export async function getSubredditInfo(subreddit: string, bypassCache = false) {
  const fetcher = () => redditFetch<{ data: SubredditData }>(`/r/${subreddit}/about`);
  if (bypassCache) return fetcher();
  return withCache(CacheKeys.subredditInfo(subreddit), fetcher, 600);
}

export async function getSubredditRules(subreddit: string) {
  return redditFetch<{ rules: SubredditRule[] }>(`/r/${subreddit}/about/rules`);
}

export async function subscribeSubreddit(subreddit: string, action: 'sub' | 'unsub') {
  return redditFetch<void>('/api/subscribe', {
    method: 'POST',
    body: new URLSearchParams({ action, sr_name: subreddit }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

export async function getSubredditFlairs(subreddit: string) {
  return redditFetch<Array<{ text: string; id: string }>>(`/r/${subreddit}/api/link_flair_v2`);
}

export async function searchSubredditByFlair(
  subreddit: string,
  flair: string,
  sort: FeedSort = 'new',
  after?: string,
  limit = 25,
) {
  const params = new URLSearchParams({
    q: `flair_name:"${flair}"`,
    restrict_sr: 'on',
    sort,
    limit: String(limit),
    type: 'link',
    ...(after && { after }),
  });
  return redditFetch<RedditListing>(`/r/${subreddit}/search?${params}`);
}

// ---- Types ----

export interface RedditListing {
  data: {
    after: string | null;
    before: string | null;
    children: Array<{ kind: string; data: PostData | CommentData }>;
  };
}

export interface PostData {
  id: string;
  name: string;
  title: string;
  author: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  selftext: string;
  url: string;
  thumbnail: string;
  preview?: { images: Array<{ source: { url: string; width: number; height: number } }> };
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  is_self: boolean;
  likes: boolean | null;
  saved: boolean;
  over_18: boolean;
  stickied: boolean;
  is_video: boolean;
  media?: { reddit_video?: { hls_url: string; fallback_url: string } };
  post_hint?: string;
  link_flair_text?: string;
}

export interface CommentData {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  replies: RedditListing | '';
  depth: number;
  likes: boolean | null;
  is_submitter: boolean;
}

export interface RedditUser {
  id: string;
  name: string;
  icon_img: string;
  total_karma: number;
  link_karma: number;
  comment_karma: number;
  created_utc: number;
  is_gold: boolean;
  verified: boolean;
}

export interface SubredditData {
  id: string;
  display_name: string;
  title: string;
  public_description: string;
  subscribers: number;
  icon_img: string;
  banner_img: string;
  user_is_subscriber: boolean;
  over18: boolean;
}

export interface SubredditRule {
  short_name: string;
  description: string;
  kind: 'link' | 'comment' | 'all';
  violation_reason: string;
}
