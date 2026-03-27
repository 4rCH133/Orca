import { exportAsJSON, exportAsCSV, exportAsMarkdown } from '../export';
import type { LocalPost } from '@/db/likes';

const mockPosts: LocalPost[] = [
  {
    id: 'p1',
    title: 'Test Post Title',
    author: 'testuser',
    subreddit: 'programming',
    url: 'https://example.com',
    thumbnail: null,
    score: 42,
    num_comments: 10,
    created_utc: 1700000000,
    permalink: '/r/programming/comments/p1',
    flair: 'Tutorial',
  },
  {
    id: 'p2',
    title: 'Post with "quotes" and, commas',
    author: 'another_user',
    subreddit: 'reactnative',
    url: 'https://example.com/article',
    thumbnail: null,
    score: 100,
    num_comments: 25,
    created_utc: 1700001000,
    permalink: '/r/reactnative/comments/p2',
    flair: null,
  },
];

describe('exportAsJSON', () => {
  it('returns valid JSON string', () => {
    const result = exportAsJSON(mockPosts);
    expect(() => JSON.parse(result)).not.toThrow();
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('p1');
  });

  it('handles empty array', () => {
    const result = exportAsJSON([]);
    expect(JSON.parse(result)).toEqual([]);
  });
});

describe('exportAsCSV', () => {
  it('includes header row with column names', () => {
    const result = exportAsCSV(mockPosts);
    const firstLine = result.split('\n')[0];
    expect(firstLine).toContain('id');
    expect(firstLine).toContain('title');
    expect(firstLine).toContain('score');
  });

  it('escapes commas and quotes in post titles', () => {
    const result = exportAsCSV(mockPosts);
    // The second post has commas and quotes — should be wrapped in quotes with doubled quotes
    expect(result).toContain('"Post with ""quotes"" and, commas"');
  });

  it('handles empty array', () => {
    const result = exportAsCSV([]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(1); // just the header
  });
});

describe('exportAsMarkdown', () => {
  it('formats each post as a section', () => {
    const result = exportAsMarkdown(mockPosts);
    expect(result).toContain('## Test Post Title');
    expect(result).toContain('u/testuser');
    expect(result).toContain('r/programming');
    expect(result).toContain('**Score:** 42');
  });

  it('includes flair when present', () => {
    const result = exportAsMarkdown(mockPosts);
    expect(result).toContain('**Flair:** Tutorial');
  });

  it('handles empty array with message', () => {
    const result = exportAsMarkdown([]);
    expect(result).toContain('No posts to export');
  });
});
