/**
 * Read post tracking tests.
 * Mocks the schema module's getDb() to return a fake DB object.
 */

// Define mock DB inside the factory so it's available when jest.mock runs (hoisted)
jest.mock('../schema', () => {
  const db = {
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
  return {
    getDb: jest.fn().mockResolvedValue(db),
    __mockDb: db,
  };
});

import { markAsRead, isRead, getReadIds, evictOldReads } from '../readPosts';

// Access the mock DB for assertions
const { __mockDb: mockDb } = require('../schema');

describe('readPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getAllAsync.mockResolvedValue([]);
    mockDb.getFirstAsync.mockResolvedValue(null);
  });

  describe('markAsRead', () => {
    it('calls INSERT OR IGNORE on the database', async () => {
      await markAsRead('post123');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR IGNORE'),
        ['post123'],
      );
    });
  });

  describe('isRead', () => {
    it('returns false when post is not in database', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      const result = await isRead('post123');
      expect(result).toBe(false);
    });

    it('returns true when post exists in database', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ post_id: 'post123' });
      const result = await isRead('post123');
      expect(result).toBe(true);
    });
  });

  describe('getReadIds', () => {
    it('returns an empty Set when no posts are read', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);
      const result = await getReadIds();
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('returns a Set of post IDs', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { post_id: 'a' },
        { post_id: 'b' },
        { post_id: 'c' },
      ]);
      const result = await getReadIds();
      expect(result.size).toBe(3);
      expect(result.has('a')).toBe(true);
      expect(result.has('b')).toBe(true);
      expect(result.has('c')).toBe(true);
    });

    it('passes the limit parameter to the query', async () => {
      await getReadIds(500);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        [500],
      );
    });
  });

  describe('evictOldReads', () => {
    it('calls DELETE with keepCount parameter', async () => {
      await evictOldReads(5000);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [5000],
      );
    });

    it('uses default keepCount of 10000', async () => {
      await evictOldReads();
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [10000],
      );
    });
  });
});
