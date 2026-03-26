/**
 * Visited posts tracking tests.
 * Mocks the schema module's getDb() to return a fake DB object.
 */

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

import { getKnownCommentIds, saveKnownCommentIds, evictOldVisits } from '../visitedPosts';

const { __mockDb: mockDb } = require('../schema');

describe('visitedPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getFirstAsync.mockResolvedValue(null);
  });

  describe('getKnownCommentIds', () => {
    it('returns empty Set on first visit', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);
      const result = await getKnownCommentIds('post1');
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('returns Set of known IDs on revisit', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        known_comment_ids: '["c1","c2","c3"]',
      });
      const result = await getKnownCommentIds('post1');
      expect(result.size).toBe(3);
      expect(result.has('c1')).toBe(true);
      expect(result.has('c2')).toBe(true);
      expect(result.has('c3')).toBe(true);
    });

    it('handles malformed JSON gracefully', async () => {
      mockDb.getFirstAsync.mockResolvedValue({
        known_comment_ids: 'not-json',
      });
      const result = await getKnownCommentIds('post1');
      expect(result.size).toBe(0);
    });
  });

  describe('saveKnownCommentIds', () => {
    it('calls INSERT OR REPLACE with JSON string', async () => {
      await saveKnownCommentIds('post1', ['c1', 'c2']);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE'),
        ['post1', '["c1","c2"]'],
      );
    });
  });

  describe('evictOldVisits', () => {
    it('calls DELETE with default keepCount', async () => {
      await evictOldVisits();
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [500],
      );
    });

    it('calls DELETE with custom keepCount', async () => {
      await evictOldVisits(100);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [100],
      );
    });
  });
});
