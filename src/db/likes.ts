import { Platform } from 'react-native';
import { getDb } from './schema';
import { PostData } from '@/api/reddit';

const isNative = Platform.OS !== 'web';

export interface LocalPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  thumbnail: string | null;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  liked_at?: number;
  saved_at?: number;
  flair: string | null;
  body_snippet?: string | null;
  folder_id?: string | null;
  highlighted_title?: string;
}

export interface AdvancedSearchOptions {
  subreddit?: string;
  dateFrom?: number; // unix timestamp
  sortBy?: 'rank' | 'score' | 'date';
  limit?: number;
  offset?: number;
}

function postDataToLocal(post: PostData): Omit<LocalPost, 'liked_at' | 'saved_at'> {
  return {
    id: post.id,
    title: post.title,
    author: post.author,
    subreddit: post.subreddit,
    url: post.url,
    thumbnail: post.thumbnail !== 'self' && post.thumbnail !== 'default' ? post.thumbnail : null,
    score: post.score,
    num_comments: post.num_comments,
    created_utc: post.created_utc,
    permalink: post.permalink,
    flair: post.link_flair_text ?? null,
    body_snippet: post.selftext?.slice(0, 500) ?? null,
  };
}

/** Sanitize FTS5 query — strip special operators that could cause syntax errors */
function sanitizeFtsQuery(query: string): string {
  return query.replace(/[*"()]/g, '').trim();
}

// ---- Liked Posts ----

export async function upsertLikedPost(post: PostData) {
  if (!isNative) return;
  const db = await getDb();
  const p = postDataToLocal(post);
  await db.runAsync(
    `INSERT OR REPLACE INTO liked_posts
       (id, title, author, subreddit, url, thumbnail, score, num_comments, created_utc, permalink, flair, body_snippet)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.title, p.author, p.subreddit, p.url, p.thumbnail, p.score, p.num_comments, p.created_utc, p.permalink, p.flair, p.body_snippet]
  );
}

export async function removeLikedPost(postId: string) {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM liked_posts WHERE id = ?', [postId]);
}

export async function searchLikedPosts(query: string, limit = 50): Promise<LocalPost[]> {
  if (!isNative) return [];
  if (!query.trim()) return getLikedPosts(limit);
  const db = await getDb();
  return db.getAllAsync<LocalPost>(
    `SELECT lp.* FROM liked_posts lp
     JOIN liked_posts_fts fts ON lp.rowid = fts.rowid
     WHERE liked_posts_fts MATCH ?
     ORDER BY rank LIMIT ?`,
    [`${query}*`, limit]
  );
}

export async function getLikedPosts(limit = 50, offset = 0): Promise<LocalPost[]> {
  if (!isNative) return [];
  const db = await getDb();
  return db.getAllAsync<LocalPost>(
    'SELECT * FROM liked_posts ORDER BY liked_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}

// ---- Saved Posts ----

export async function upsertSavedPost(post: PostData) {
  if (!isNative) return;
  const db = await getDb();
  const p = postDataToLocal(post);
  await db.runAsync(
    `INSERT OR REPLACE INTO saved_posts
       (id, title, author, subreddit, url, thumbnail, score, num_comments, created_utc, permalink, flair, body_snippet)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.title, p.author, p.subreddit, p.url, p.thumbnail, p.score, p.num_comments, p.created_utc, p.permalink, p.flair, p.body_snippet]
  );
}

export async function removeSavedPost(postId: string) {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM saved_posts WHERE id = ?', [postId]);
}

export async function searchSavedPosts(query: string, limit = 50): Promise<LocalPost[]> {
  if (!isNative) return [];
  if (!query.trim()) return getSavedPosts(limit);
  const db = await getDb();
  return db.getAllAsync<LocalPost>(
    `SELECT sp.* FROM saved_posts sp
     JOIN saved_posts_fts fts ON sp.rowid = fts.rowid
     WHERE saved_posts_fts MATCH ?
     ORDER BY rank LIMIT ?`,
    [`${query}*`, limit]
  );
}

export async function getSavedPosts(limit = 50, offset = 0): Promise<LocalPost[]> {
  if (!isNative) return [];
  const db = await getDb();
  return db.getAllAsync<LocalPost>(
    'SELECT * FROM saved_posts ORDER BY saved_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}

// ---- Downvoted Posts ----

export async function upsertDownvotedPost(post: PostData) {
  if (!isNative) return;
  const db = await getDb();
  const p = postDataToLocal(post);
  await db.runAsync(
    `INSERT OR REPLACE INTO downvoted_posts
       (id, title, author, subreddit, url, thumbnail, score, num_comments, created_utc, permalink, flair, body_snippet)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.title, p.author, p.subreddit, p.url, p.thumbnail, p.score, p.num_comments, p.created_utc, p.permalink, p.flair, p.body_snippet]
  );
}

export async function removeDownvotedPost(postId: string) {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM downvoted_posts WHERE id = ?', [postId]);
}

export async function searchDownvotedPosts(query: string, limit = 50): Promise<LocalPost[]> {
  if (!isNative) return [];
  if (!query.trim()) return getDownvotedPosts(limit);
  const db = await getDb();
  return db.getAllAsync<LocalPost>(
    `SELECT dp.* FROM downvoted_posts dp
     JOIN downvoted_posts_fts fts ON dp.rowid = fts.rowid
     WHERE downvoted_posts_fts MATCH ?
     ORDER BY rank LIMIT ?`,
    [`${query}*`, limit]
  );
}

export async function getDownvotedPosts(limit = 50, offset = 0): Promise<LocalPost[]> {
  if (!isNative) return [];
  const db = await getDb();
  return db.getAllAsync<LocalPost>(
    'SELECT * FROM downvoted_posts ORDER BY downvoted_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}

// ---- Advanced Search (with filters, sort, highlighting) ----

export async function searchLikedPostsAdvanced(
  query: string,
  options: AdvancedSearchOptions = {},
): Promise<LocalPost[]> {
  if (!isNative) return [];
  const { subreddit, dateFrom, sortBy = 'rank', limit = 50, offset = 0 } = options;

  if (!query.trim()) {
    return getLikedPostsFiltered(subreddit, dateFrom, sortBy, limit, offset);
  }

  const db = await getDb();
  const sanitized = sanitizeFtsQuery(query);
  if (!sanitized) return getLikedPosts(limit, offset);

  const params: any[] = [`${sanitized}*`];
  let whereExtra = '';
  if (subreddit) { whereExtra += ' AND lp.subreddit = ?'; params.push(subreddit); }
  if (dateFrom) { whereExtra += ' AND lp.liked_at >= ?'; params.push(dateFrom); }

  const orderBy = sortBy === 'score' ? 'lp.score DESC' : sortBy === 'date' ? 'lp.liked_at DESC' : 'rank';

  params.push(limit, offset);
  return db.getAllAsync<LocalPost>(
    `SELECT lp.*, highlight(liked_posts_fts, 1, '<mark>', '</mark>') as highlighted_title
     FROM liked_posts lp
     JOIN liked_posts_fts fts ON lp.rowid = fts.rowid
     WHERE liked_posts_fts MATCH ?${whereExtra}
     ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    params,
  );
}

async function getLikedPostsFiltered(
  subreddit?: string, dateFrom?: number, sortBy = 'date', limit = 50, offset = 0,
): Promise<LocalPost[]> {
  if (!isNative) return [];
  const db = await getDb();
  const params: any[] = [];
  let where = '1=1';
  if (subreddit) { where += ' AND subreddit = ?'; params.push(subreddit); }
  if (dateFrom) { where += ' AND liked_at >= ?'; params.push(dateFrom); }
  const orderBy = sortBy === 'score' ? 'score DESC' : 'liked_at DESC';
  params.push(limit, offset);
  return db.getAllAsync<LocalPost>(
    `SELECT * FROM liked_posts WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    params,
  );
}

// ---- Utility Queries ----

export async function getDistinctSubreddits(table: 'liked_posts' | 'saved_posts' | 'downvoted_posts' = 'liked_posts'): Promise<string[]> {
  if (!isNative) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<{ subreddit: string }>(
    `SELECT DISTINCT subreddit FROM ${table} ORDER BY subreddit`,
  );
  return rows.map((r: { subreddit: string }) => r.subreddit);
}

export async function getPostCount(table: 'liked_posts' | 'saved_posts' | 'downvoted_posts' = 'liked_posts'): Promise<number> {
  if (!isNative) return 0;
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
  return row?.count ?? 0;
}
