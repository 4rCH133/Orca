/**
 * Folder CRUD — organize saved posts into folders.
 */

import { Platform } from 'react-native';
import { getDb } from './schema';
import type { LocalPost } from './likes';

const isNative = Platform.OS !== 'web';

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function createFolder(name: string, color = '#3B9FD4', icon = '📁'): Promise<string> {
  if (!isNative) return '';
  if (!name.trim()) throw new Error('Folder name cannot be empty');
  const db = await getDb();
  const id = generateId();
  const maxOrder = await db.getFirstAsync<{ m: number }>('SELECT MAX(sort_order) as m FROM folders');
  const sortOrder = (maxOrder?.m ?? -1) + 1;
  await db.runAsync(
    'INSERT INTO folders (id, name, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
    [id, name.trim(), color, icon, sortOrder],
  );
  return id;
}

export async function updateFolder(id: string, updates: Partial<Pick<Folder, 'name' | 'color' | 'icon'>>): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  const sets: string[] = [];
  const params: any[] = [];
  if (updates.name !== undefined) { sets.push('name = ?'); params.push(updates.name); }
  if (updates.color !== undefined) { sets.push('color = ?'); params.push(updates.color); }
  if (updates.icon !== undefined) { sets.push('icon = ?'); params.push(updates.icon); }
  if (sets.length === 0) return;
  params.push(id);
  await db.runAsync(`UPDATE folders SET ${sets.join(', ')} WHERE id = ?`, params);
}

export async function deleteFolder(id: string): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  // Delete folder but don't delete posts — folder_id stays on posts (orphaned, filtered out)
  await db.runAsync('DELETE FROM folders WHERE id = ?', [id]);
}

export async function getFolders(): Promise<Folder[]> {
  if (!isNative) return [];
  const db = await getDb();
  return db.getAllAsync<Folder>('SELECT * FROM folders ORDER BY sort_order ASC');
}

export async function assignPostToFolder(postId: string, folderId: string, table: 'liked_posts' | 'saved_posts' = 'saved_posts'): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync(`UPDATE ${table} SET folder_id = ? WHERE id = ?`, [folderId, postId]);
}

export async function removePostFromFolder(postId: string, table: 'liked_posts' | 'saved_posts' = 'saved_posts'): Promise<void> {
  if (!isNative) return;
  const db = await getDb();
  await db.runAsync(`UPDATE ${table} SET folder_id = NULL WHERE id = ?`, [postId]);
}

export async function getPostsByFolder(folderId: string, table: 'liked_posts' | 'saved_posts' = 'saved_posts', limit = 50, offset = 0): Promise<LocalPost[]> {
  if (!isNative) return [];
  const db = await getDb();
  return db.getAllAsync<LocalPost>(
    `SELECT * FROM ${table} WHERE folder_id = ? ORDER BY rowid DESC LIMIT ? OFFSET ?`,
    [folderId, limit, offset],
  );
}
