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
  };
}

// ---- Liked Posts ----

export async function upsertLikedPost(post: PostData) {
  if (!isNative) return;
  const db = await getDb();
  const p = postDataToLocal(post);
  await db.runAsync(
    `INSERT OR REPLACE INTO liked_posts
       (id, title, author, subreddit, url, thumbnail, score, num_comments, created_utc, permalink, flair)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.title, p.author, p.subreddit, p.url, p.thumbnail, p.score, p.num_comments, p.created_utc, p.permalink, p.flair]
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
       (id, title, author, subreddit, url, thumbnail, score, num_comments, created_utc, permalink, flair)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.title, p.author, p.subreddit, p.url, p.thumbnail, p.score, p.num_comments, p.created_utc, p.permalink, p.flair]
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
