/**
 * Likes/Saved/Downvoted DB tests — core offline search feature.
 * Tests the CRUD operations and FTS5 search query construction.
 */

jest.mock('../schema', () => {
  const db = {
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
  return { getDb: jest.fn().mockResolvedValue(db), __mockDb: db };
});

import {
  upsertLikedPost, removeLikedPost, searchLikedPosts, getLikedPosts,
  upsertSavedPost, removeSavedPost, searchSavedPosts, getSavedPosts,
  upsertDownvotedPost, removeDownvotedPost, searchDownvotedPosts, getDownvotedPosts,
} from '../likes';
import type { PostData } from '@/api/reddit';

const { __mockDb: mockDb } = require('../schema');

const mockPost: PostData = {
  id: 'test123',
  name: 't3_test123',
  title: 'Test Post Title',
  author: 'testauthor',
  subreddit: 'reactnative',
  subreddit_name_prefixed: 'r/reactnative',
  selftext: '',
  url: 'https://example.com',
  thumbnail: 'https://example.com/thumb.jpg',
  score: 42,
  upvote_ratio: 0.95,
  num_comments: 10,
  created_utc: 1700000000,
  permalink: '/r/reactnative/comments/test123',
  is_self: false,
  likes: null,
  saved: false,
  over_18: false,
  stickied: false,
  is_video: false,
  link_flair_text: 'Project',
};

describe('liked_posts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('upsertLikedPost calls INSERT OR REPLACE with 11 params', async () => {
    await upsertLikedPost(mockPost);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO liked_posts'),
      expect.arrayContaining(['test123', 'Test Post Title', 'testauthor', 'reactnative']),
    );
    // Verify 11 params total
    expect(mockDb.runAsync.mock.calls[0][1]).toHaveLength(11);
  });

  it('removeLikedPost calls DELETE with post ID', async () => {
    await removeLikedPost('test123');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM liked_posts'),
      ['test123'],
    );
  });

  it('searchLikedPosts with empty query falls through to getLikedPosts', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await searchLikedPosts('');
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM liked_posts ORDER BY liked_at DESC'),
      expect.anything(),
    );
  });

  it('searchLikedPosts with query appends * wildcard for FTS5 prefix match', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await searchLikedPosts('react');
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('liked_posts_fts MATCH'),
      ['react*', 50],
    );
  });

  it('getLikedPosts passes limit and offset', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getLikedPosts(25, 10);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT ? OFFSET ?'),
      [25, 10],
    );
  });

  it('filters thumbnail: self → null, default → null, valid URL → kept', async () => {
    const selfPost = { ...mockPost, thumbnail: 'self' };
    await upsertLikedPost(selfPost);
    const params = mockDb.runAsync.mock.calls[0][1];
    expect(params[5]).toBeNull(); // thumbnail position is index 5

    jest.clearAllMocks();
    const defaultPost = { ...mockPost, thumbnail: 'default' };
    await upsertLikedPost(defaultPost);
    expect(mockDb.runAsync.mock.calls[0][1][5]).toBeNull();

    jest.clearAllMocks();
    const urlPost = { ...mockPost, thumbnail: 'https://example.com/img.jpg' };
    await upsertLikedPost(urlPost);
    expect(mockDb.runAsync.mock.calls[0][1][5]).toBe('https://example.com/img.jpg');
  });
});

describe('saved_posts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('upsertSavedPost calls INSERT OR REPLACE into saved_posts', async () => {
    await upsertSavedPost(mockPost);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO saved_posts'),
      expect.any(Array),
    );
  });

  it('removeSavedPost calls DELETE from saved_posts', async () => {
    await removeSavedPost('test123');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM saved_posts'),
      ['test123'],
    );
  });

  it('searchSavedPosts with query uses FTS5 MATCH', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await searchSavedPosts('sqlite');
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('saved_posts_fts MATCH'),
      ['sqlite*', 50],
    );
  });

  it('getSavedPosts returns results ordered by saved_at DESC', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getSavedPosts(30, 5);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY saved_at DESC'),
      [30, 5],
    );
  });
});

describe('downvoted_posts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('upsertDownvotedPost calls INSERT OR REPLACE into downvoted_posts', async () => {
    await upsertDownvotedPost(mockPost);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO downvoted_posts'),
      expect.any(Array),
    );
  });

  it('removeDownvotedPost calls DELETE from downvoted_posts', async () => {
    await removeDownvotedPost('test123');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM downvoted_posts'),
      ['test123'],
    );
  });

  it('searchDownvotedPosts with query uses FTS5 MATCH', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await searchDownvotedPosts('spam');
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('downvoted_posts_fts MATCH'),
      ['spam*', 50],
    );
  });

  it('getDownvotedPosts returns results ordered by downvoted_at DESC', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getDownvotedPosts(20, 0);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY downvoted_at DESC'),
      [20, 0],
    );
  });
});
