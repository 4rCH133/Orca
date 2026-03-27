/**
 * Content filter CRUD — manage keyword/domain/user/sub/flair filters.
 * The actual filtering logic is in src/utils/contentFilter.ts (pure util).
 * This module handles persistence in SQLite.
 */

import { Platform } from 'react-native';
import { getDb } from './schema';

const isNative = Platform.OS !== 'web';

export interface ContentFilter {
  id: string;
  type: 'keyword' | 'domain' | 'username' | 'subreddit' | 'flair';
  value: string;
  scope: string;
  is_regex: number;
  enabled: number;
  match_count: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function createFilter(
  type: ContentFilter['type'],
  value: string,
  scope = 'all',
  isRegex = false,
): Promise<string> {
  if (!isNative) return '';
  const db = await getDb();
  const id = generateId();
  await db.runAsync(
    'INSERT INTO content_filters (id, type, value, scope, is_regex) VALUES (?, ?, ?, ?, ?)',
    [id, type, value, scope, isRegex ? 1 : 0],
  );
  return id;
}

export async function updateFilter(id: string, updates: Partial<Pick<ContentFilter, 'value' | 'scope' | 'is_regex' | 'enabled'>>): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  const sets: string[] = [];
  const params: any[] = [];
  if (updates.value !== undefined) { sets.push('value = ?'); params.push(updates.value); }
  if (updates.scope !== undefined) { sets.push('scope = ?'); params.push(updates.scope); }
  if (updates.is_regex !== undefined) { sets.push('is_regex = ?'); params.push(updates.is_regex); }
  if (updates.enabled !== undefined) { sets.push('enabled = ?'); params.push(updates.enabled); }
  if (sets.length === 0) return;
  params.push(id);
  await db.runAsync(`UPDATE content_filters SET ${sets.join(', ')} WHERE id = ?`, params);
}

export async function deleteFilter(id: string): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM content_filters WHERE id = ?', [id]);
}

export async function getFilters(): Promise<ContentFilter[]> {
  if (!isNative) return [];
  const db = await getDb();
  return db.getAllAsync<ContentFilter>('SELECT * FROM content_filters ORDER BY type, value');
}

export async function incrementMatchCount(id: string): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync('UPDATE content_filters SET match_count = match_count + 1 WHERE id = ?', [id]);
}
