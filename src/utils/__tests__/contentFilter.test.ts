import { applyFilters, type ContentFilter } from '../contentFilter';
import type { PostData } from '@/api/reddit';

function mockPost(overrides: Partial<PostData> = {}): PostData {
  return {
    id: 'p1',
    name: 't3_p1',
    title: 'Default Test Post Title',
    author: 'testuser',
    subreddit: 'programming',
    subreddit_name_prefixed: 'r/programming',
    selftext: '',
    url: 'https://example.com/article',
    thumbnail: 'default',
    score: 42,
    upvote_ratio: 0.95,
    num_comments: 10,
    created_utc: Date.now() / 1000,
    permalink: '/r/programming/comments/p1',
    is_self: false,
    likes: null,
    saved: false,
    over_18: false,
    stickied: false,
    is_video: false,
    ...overrides,
  };
}

function mockFilter(overrides: Partial<ContentFilter> = {}): ContentFilter {
  return {
    id: 'f1',
    type: 'keyword',
    value: 'test',
    scope: 'all',
    is_regex: false,
    enabled: true,
    match_count: 0,
    ...overrides,
  };
}

describe('applyFilters', () => {
  // ---- KEYWORD FILTERS ----

  it('keyword filter hides post with matching title', () => {
    const posts = [mockPost({ id: 'a', title: 'Election Results 2026' })];
    const filters = [mockFilter({ type: 'keyword', value: 'election' })];
    const result = applyFilters(posts, filters);
    expect(result.visible).toHaveLength(0);
    expect(result.filteredCount).toBe(1);
  });

  it('keyword filter is case-insensitive', () => {
    const posts = [mockPost({ id: 'a', title: 'ELECTION Results' })];
    const filters = [mockFilter({ type: 'keyword', value: 'election' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
  });

  it('keyword filter does NOT hide non-matching post', () => {
    const posts = [mockPost({ id: 'a', title: 'How to Cook Pasta Perfectly' })];
    const filters = [mockFilter({ type: 'keyword', value: 'election' })];
    const result = applyFilters(posts, filters);
    expect(result.visible).toHaveLength(1);
  });

  it('keyword "election" matches "Natural Selection" (substring match by design)', () => {
    const posts = [mockPost({ id: 'a', title: 'Natural Selection in Animals' })];
    const filters = [mockFilter({ type: 'keyword', value: 'election' })];
    const result = applyFilters(posts, filters);
    // "selection" contains "election" — this is expected behavior for contains-match
    // Use regex \\belection\\b for word-boundary matching
    expect(result.filteredCount).toBe(1);
  });

  it('keyword "elect" matches "election" (substring match)', () => {
    const posts = [mockPost({ id: 'a', title: 'Election Day' })];
    const filters = [mockFilter({ type: 'keyword', value: 'elect' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
  });

  // ---- REGEX FILTERS ----

  it('regex filter \\belection\\b matches "election" but not "selection"', () => {
    const posts = [
      mockPost({ id: 'a', title: 'The election was close' }),
      mockPost({ id: 'b', title: 'Natural selection' }),
    ];
    const filters = [mockFilter({ type: 'keyword', value: '\\belection\\b', is_regex: true })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
    expect(result.filteredIds.has('a')).toBe(true);
    expect(result.filteredIds.has('b')).toBe(false);
  });

  it('invalid regex does not crash — treated as non-match', () => {
    const posts = [mockPost({ id: 'a', title: 'Test post' })];
    const filters = [mockFilter({ type: 'keyword', value: '[invalid(regex', is_regex: true })];
    expect(() => applyFilters(posts, filters)).not.toThrow();
    const result = applyFilters(posts, filters);
    expect(result.visible).toHaveLength(1);
  });

  // ---- DOMAIN FILTERS ----

  it('domain filter hides link post from matching domain', () => {
    const posts = [mockPost({ id: 'a', url: 'https://dailymail.co.uk/story/123' })];
    const filters = [mockFilter({ type: 'domain', value: 'dailymail.co.uk' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
  });

  it('domain filter strips www. prefix', () => {
    const posts = [mockPost({ id: 'a', url: 'https://www.dailymail.co.uk/story' })];
    const filters = [mockFilter({ type: 'domain', value: 'dailymail.co.uk' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
  });

  it('domain filter does not hide self posts', () => {
    const posts = [mockPost({ id: 'a', is_self: true, url: 'https://reddit.com/r/test' })];
    const filters = [mockFilter({ type: 'domain', value: 'reddit.com' })];
    const result = applyFilters(posts, filters);
    expect(result.visible).toHaveLength(1);
  });

  it('domain filter handles undefined url gracefully', () => {
    const posts = [mockPost({ id: 'a', url: undefined as any })];
    const filters = [mockFilter({ type: 'domain', value: 'example.com' })];
    expect(() => applyFilters(posts, filters)).not.toThrow();
  });

  // ---- USERNAME FILTERS ----

  it('username filter hides posts by matching author', () => {
    const posts = [mockPost({ id: 'a', author: 'spambot123' })];
    const filters = [mockFilter({ type: 'username', value: 'spambot123' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
  });

  it('username filter is case-insensitive', () => {
    const posts = [mockPost({ id: 'a', author: 'SpamBot123' })];
    const filters = [mockFilter({ type: 'username', value: 'spambot123' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
  });

  // ---- SUBREDDIT FILTERS ----

  it('subreddit filter hides posts from matching subreddit', () => {
    const posts = [mockPost({ id: 'a', subreddit: 'politics' })];
    const filters = [mockFilter({ type: 'subreddit', value: 'politics' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
  });

  // ---- FLAIR FILTERS ----

  it('flair filter hides posts with matching flair', () => {
    const posts = [mockPost({ id: 'a', link_flair_text: 'Spoiler' })];
    const filters = [mockFilter({ type: 'flair', value: 'Spoiler' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
  });

  it('flair filter handles null link_flair_text gracefully', () => {
    const posts = [mockPost({ id: 'a', link_flair_text: undefined })];
    const filters = [mockFilter({ type: 'flair', value: 'Spoiler' })];
    const result = applyFilters(posts, filters);
    expect(result.visible).toHaveLength(1);
  });

  // ---- DISABLED FILTERS ----

  it('disabled filter has no effect', () => {
    const posts = [mockPost({ id: 'a', title: 'Election Day' })];
    const filters = [mockFilter({ type: 'keyword', value: 'election', enabled: false })];
    const result = applyFilters(posts, filters);
    expect(result.visible).toHaveLength(1);
  });

  // ---- SCOPE ----

  it('scoped filter only applies in specified subreddit', () => {
    const posts = [
      mockPost({ id: 'a', title: 'Election in reactnative', subreddit: 'reactnative' }),
      mockPost({ id: 'b', title: 'Election in politics', subreddit: 'politics' }),
    ];
    const filters = [mockFilter({ type: 'keyword', value: 'election', scope: 'politics' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
    expect(result.filteredIds.has('b')).toBe(true);
    expect(result.filteredIds.has('a')).toBe(false);
  });

  // ---- MULTIPLE FILTERS (OR LOGIC) ----

  it('multiple filters: post hidden if ANY matches', () => {
    const posts = [mockPost({ id: 'a', title: 'Tech news', author: 'spambot' })];
    const filters = [
      mockFilter({ id: 'f1', type: 'keyword', value: 'politics' }),
      mockFilter({ id: 'f2', type: 'username', value: 'spambot' }),
    ];
    const result = applyFilters(posts, filters);
    expect(result.filteredCount).toBe(1);
  });

  // ---- EDGE CASES ----

  it('empty filter list returns all posts', () => {
    const posts = [mockPost({ id: 'a' }), mockPost({ id: 'b' })];
    const result = applyFilters(posts, []);
    expect(result.visible).toHaveLength(2);
    expect(result.filteredCount).toBe(0);
  });

  it('filter with empty value matches nothing', () => {
    const posts = [mockPost({ id: 'a' })];
    const filters = [mockFilter({ type: 'keyword', value: '' })];
    const result = applyFilters(posts, filters);
    expect(result.visible).toHaveLength(1);
  });

  it('returns correct filteredIds set', () => {
    const posts = [
      mockPost({ id: 'a', title: 'Bad post' }),
      mockPost({ id: 'b', title: 'Good post' }),
    ];
    const filters = [mockFilter({ type: 'keyword', value: 'bad' })];
    const result = applyFilters(posts, filters);
    expect(result.filteredIds.size).toBe(1);
    expect(result.filteredIds.has('a')).toBe(true);
  });

  it('handles large input efficiently', () => {
    const posts = Array.from({ length: 200 }, (_, i) =>
      mockPost({ id: `p${i}`, title: i % 5 === 0 ? 'Hidden post' : 'Normal post' }),
    );
    const filters = Array.from({ length: 50 }, (_, i) =>
      mockFilter({ id: `f${i}`, type: 'keyword', value: i === 0 ? 'hidden' : `nonmatch${i}` }),
    );
    const start = Date.now();
    const result = applyFilters(posts, filters);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50); // should be < 10ms, generous buffer
    expect(result.filteredCount).toBe(40); // 200/5 = 40 posts match
  });
});
