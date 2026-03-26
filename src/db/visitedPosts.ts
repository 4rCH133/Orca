/**
 * Visited post tracking — stores known comment IDs for new-comment highlighting.
 * On first visit, all comment IDs are saved. On revisit, diff reveals new comments.
 * LRU eviction at 500 posts.
 */

import { Platform } from 'react-native';
import { getDb } from './schema';

const isNative = Platform.OS !== 'web';

/**
 * Get the set of comment IDs known from the last visit to this post.
 * Returns empty Set on first visit.
 */
export async function getKnownCommentIds(postId: string): Promise<Set<string>> {
  if (!isNative) return new Set();
  const db = await getDb();
  const row = await db.getFirstAsync<{ known_comment_ids: string }>(
    'SELECT known_comment_ids FROM visited_posts WHERE post_id = ?',
    [postId],
  );
  if (!row) return new Set();
  try {
    const ids = JSON.parse(row.known_comment_ids);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

/**
 * Save the current comment IDs for this post.
 * Called when leaving the post detail screen.
 */
export async function saveKnownCommentIds(postId: string, ids: string[]): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO visited_posts (post_id, known_comment_ids)
     VALUES (?, ?)`,
    [postId, JSON.stringify(ids)],
  );
}

/**
 * Evict old visited posts beyond keepCount to prevent unbounded growth.
 */
export async function evictOldVisits(keepCount = 500): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM visited_posts WHERE post_id NOT IN (
      SELECT post_id FROM visited_posts ORDER BY visited_at DESC LIMIT ?
    )`,
    [keepCount],
  );
}
