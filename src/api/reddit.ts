/**
 * Reddit API client — thin wrapper around the OAuth REST API.
 * Uses TanStack Query for caching; raw fetches go through this client.
 */

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

async function redditFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`https://oauth.reddit.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Orca/1.0.0 (by /u/4rCH133)',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    // Token expired — auth store should handle refresh
    throw new Error('TOKEN_EXPIRED');
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
  limit = 25
) {
  return redditFetch<RedditListing>(
    `/${sort}?limit=${limit}${after ? `&after=${after}` : ''}`
  );
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

export async function getPost(postId: string) {
  return redditFetch<[RedditListing, RedditListing]>(`/comments/${postId}?limit=200`);
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

// ---- Subreddits ----

export async function getMySubreddits(after?: string) {
  return redditFetch<RedditListing>(
    `/subreddits/mine/subscriber?limit=100${after ? `&after=${after}` : ''}`
  );
}

export async function getSubredditInfo(subreddit: string) {
  return redditFetch<{ data: SubredditData }>(`/r/${subreddit}/about`);
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
