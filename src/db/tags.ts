/**
 * Tag CRUD — add colored tags to posts for organization.
 * Uses a junction table (post_tags) for many-to-many relationship.
 */

import { Platform } from 'react-native';
import { getDb } from './schema';
import type { LocalPost } from './likes';

const isNative = Platform.OS !== 'web';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function createTag(name: string, color = '#8B949E'): Promise<string> {
  if (!isNative) return '';
  if (!name.trim()) throw new Error('Tag name cannot be empty');
  const db = await getDb();
  const id = generateId();
  await db.runAsync('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)', [id, name.trim(), color]);
  return id;
}

export async function deleteTag(id: string): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM post_tags WHERE tag_id = ?', [id]);
  await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
}

export async function getTags(): Promise<Tag[]> {
  if (!isNative) return [];
  const db = await getDb();
  return db.getAllAsync<Tag>('SELECT * FROM tags ORDER BY name ASC');
}

export async function addTagToPost(postId: string, tagId: string): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
}

export async function removeTagFromPost(postId: string, tagId: string): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM post_tags WHERE post_id = ? AND tag_id = ?', [postId, tagId]);
}

export async function getTagsForPost(postId: string): Promise<Tag[]> {
  if (!isNative) return [];
  const db = await getDb();
  return db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t
     JOIN post_tags pt ON t.id = pt.tag_id
     WHERE pt.post_id = ?
     ORDER BY t.name ASC`,
    [postId],
  );
}

export async function getPostsByTag(tagId: string, table: 'liked_posts' | 'saved_posts' = 'saved_posts', limit = 50, offset = 0): Promise<LocalPost[]> {
  if (!isNative) return [];
  const db = await getDb();
  return db.getAllAsync<LocalPost>(
    `SELECT p.* FROM ${table} p
     JOIN post_tags pt ON p.id = pt.post_id
     WHERE pt.tag_id = ?
     ORDER BY p.rowid DESC LIMIT ? OFFSET ?`,
    [tagId, limit, offset],
  );
}
