/**
 * Read post tracking — marks posts as read when user views them.
 * Used to dim/hide read posts in feed. LRU eviction at 10K entries.
 */

import { Platform } from 'react-native';
import { getDb } from './schema';

const isNative = Platform.OS !== 'web';

export async function markAsRead(postId: string): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO read_posts (post_id) VALUES (?)', [postId]);
}

export async function isRead(postId: string): Promise<boolean> {
  if (!isNative) return false;
  const db = await getDb();
  const row = await db.getFirstAsync<{ post_id: string }>(
    'SELECT post_id FROM read_posts WHERE post_id = ? LIMIT 1',
    [postId]
  );
  return !!row;
}

/**
 * Get a Set of all read post IDs for O(1) lookup in feed rendering.
 * Limited to most recent `limit` entries.
 */
export async function getReadIds(limit = 10000): Promise<Set<string>> {
  if (!isNative) return new Set();
  const db = await getDb();
  const rows = await db.getAllAsync<{ post_id: string }>(
    'SELECT post_id FROM read_posts ORDER BY read_at DESC LIMIT ?',
    [limit]
  );
  return new Set(rows.map((r) => r.post_id));
}

/**
 * Evict old read posts beyond `keepCount` to prevent unbounded growth.
 * Call periodically (e.g., on app start or after sync).
 */
export async function evictOldReads(keepCount = 10000): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM read_posts WHERE post_id NOT IN (
      SELECT post_id FROM read_posts ORDER BY read_at DESC LIMIT ?
    )`,
    [keepCount]
  );
}
