jest.mock('../schema', () => {
  const db = {
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
  return { getDb: jest.fn().mockResolvedValue(db), __mockDb: db };
});

import { createFilter, updateFilter, deleteFilter, getFilters, incrementMatchCount } from '../filters';

const { __mockDb: mockDb } = require('../schema');

describe('content filters DB', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createFilter inserts with correct type and value', async () => {
    const id = await createFilter('keyword', 'election', 'all', false);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO content_filters'),
      expect.arrayContaining(['keyword', 'election', 'all', 0]),
    );
    expect(id).toBeTruthy();
  });

  it('createFilter with regex flag sets is_regex=1', async () => {
    await createFilter('keyword', '\\belection\\b', 'all', true);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO content_filters'),
      expect.arrayContaining([1]),
    );
  });

  it('updateFilter updates specified fields', async () => {
    await updateFilter('f1', { enabled: 0 });
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('enabled = ?'),
      [0, 'f1'],
    );
  });

  it('deleteFilter removes by ID', async () => {
    await deleteFilter('f1');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM content_filters'),
      ['f1'],
    );
  });

  it('getFilters returns all filters ordered', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    await getFilters();
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY type, value'),
    );
  });

  it('incrementMatchCount increases count by 1', async () => {
    await incrementMatchCount('f1');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('match_count = match_count + 1'),
      ['f1'],
    );
  });
});
