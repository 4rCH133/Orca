jest.mock('../schema', () => {
  const db = {
    runAsync: jest.fn(),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
  return { getDb: jest.fn().mockResolvedValue(db), __mockDb: db };
});

import { createFolder, updateFolder, deleteFolder, getFolders, assignPostToFolder, removePostFromFolder, getPostsByFolder } from '../folders';

const { __mockDb: mockDb } = require('../schema');

describe('folders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createFolder inserts with correct params', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ m: 2 });
    const id = await createFolder('Recipes', '#3FB950', '🍳');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO folders'),
      expect.arrayContaining(['Recipes', '#3FB950', '🍳', 3]),
    );
    expect(id).toBeTruthy();
  });

  it('createFolder with empty name throws', async () => {
    await expect(createFolder('')).rejects.toThrow('Folder name cannot be empty');
  });

  it('deleteFolder removes folder but not posts', async () => {
    await deleteFolder('folder1');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM folders'),
      ['folder1'],
    );
    // Should NOT delete from liked_posts or saved_posts
    expect(mockDb.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM liked_posts'),
      expect.anything(),
    );
  });

  it('assignPostToFolder updates folder_id', async () => {
    await assignPostToFolder('post1', 'folder1');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('SET folder_id'),
      ['folder1', 'post1'],
    );
  });

  it('removePostFromFolder sets folder_id to NULL', async () => {
    await removePostFromFolder('post1');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('folder_id = NULL'),
      ['post1'],
    );
  });

  it('getPostsByFolder filters by folder_id', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getPostsByFolder('folder1');
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE folder_id = ?'),
      expect.arrayContaining(['folder1']),
    );
  });

  it('getFolders returns ordered by sort_order', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getFolders();
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY sort_order ASC'),
    );
  });

  it('updateFolder changes specified fields', async () => {
    await updateFolder('f1', { name: 'Updated', color: '#FF0000' });
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('name = ?'),
      expect.arrayContaining(['Updated', '#FF0000', 'f1']),
    );
  });
});
