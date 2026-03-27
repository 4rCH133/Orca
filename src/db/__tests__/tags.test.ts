jest.mock('../schema', () => {
  const db = {
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
  return { getDb: jest.fn().mockResolvedValue(db), __mockDb: db };
});

import { createTag, deleteTag, getTags, addTagToPost, removeTagFromPost, getTagsForPost, getPostsByTag } from '../tags';

const { __mockDb: mockDb } = require('../schema');

describe('tags', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createTag inserts into tags table', async () => {
    const id = await createTag('important', '#FF4500');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tags'),
      expect.arrayContaining(['important', '#FF4500']),
    );
    expect(id).toBeTruthy();
  });

  it('createTag with empty name throws', async () => {
    await expect(createTag('')).rejects.toThrow('Tag name cannot be empty');
  });

  it('deleteTag removes from tags and post_tags', async () => {
    await deleteTag('tag1');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM post_tags WHERE tag_id'),
      ['tag1'],
    );
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM tags WHERE id'),
      ['tag1'],
    );
  });

  it('addTagToPost inserts into junction table', async () => {
    await addTagToPost('post1', 'tag1');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE INTO post_tags'),
      ['post1', 'tag1'],
    );
  });

  it('removeTagFromPost deletes from junction table', async () => {
    await removeTagFromPost('post1', 'tag1');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM post_tags'),
      ['post1', 'tag1'],
    );
  });

  it('getTagsForPost joins tags with post_tags', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getTagsForPost('post1');
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('JOIN post_tags'),
      ['post1'],
    );
  });

  it('getPostsByTag joins post_tags with posts', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getPostsByTag('tag1');
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('JOIN post_tags'),
      expect.arrayContaining(['tag1']),
    );
  });

  it('getTags returns ordered by name', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getTags();
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY name ASC'),
    );
  });
});
