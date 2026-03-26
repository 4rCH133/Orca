import { flattenCommentTree, toggleCollapse, insertMoreChildren, type FlatComment } from '../commentTree';
import type { CommentData, RedditListing } from '@/api/reddit';

// Helper to create a mock comment
function mockComment(overrides: Partial<CommentData> = {}): CommentData {
  return {
    id: 'c1',
    body: 'Test comment',
    author: 'testuser',
    score: 10,
    created_utc: Date.now() / 1000,
    replies: '',
    depth: 0,
    likes: null,
    is_submitter: false,
    edited: false,
    ...overrides,
  };
}

// Helper to create nested replies
function withReplies(comment: CommentData, replies: CommentData[]): CommentData {
  return {
    ...comment,
    replies: {
      data: {
        after: null,
        before: null,
        children: replies.map((r) => ({ kind: 't1', data: r })),
      },
    } as RedditListing,
  };
}

// Helper to add a "more" entry to replies
function withMoreChildren(comment: CommentData, ids: string[], count: number): CommentData {
  const existing = comment.replies && typeof comment.replies !== 'string'
    ? comment.replies.data.children
    : [];
  return {
    ...comment,
    replies: {
      data: {
        after: null,
        before: null,
        children: [
          ...existing,
          { kind: 'more', data: { children: ids, count } as any },
        ],
      },
    } as RedditListing,
  };
}

describe('flattenCommentTree', () => {
  it('returns empty array for 0 comments', () => {
    expect(flattenCommentTree([])).toEqual([]);
  });

  it('returns flat items for top-level comments', () => {
    const comments = [
      mockComment({ id: 'a' }),
      mockComment({ id: 'b' }),
      mockComment({ id: 'c' }),
    ];
    const flat = flattenCommentTree(comments);
    expect(flat).toHaveLength(3);
    expect(flat.map((f) => f.comment.id)).toEqual(['a', 'b', 'c']);
    expect(flat.every((f) => f.depth === 0)).toBe(true);
  });

  it('preserves depth from nested replies', () => {
    const child = mockComment({ id: 'child', depth: 1 });
    const parent = withReplies(mockComment({ id: 'parent' }), [child]);
    const flat = flattenCommentTree([parent]);
    expect(flat).toHaveLength(2);
    expect(flat[0].depth).toBe(0);
    expect(flat[1].depth).toBe(1);
  });

  it('counts childCount correctly', () => {
    const grandchild = mockComment({ id: 'gc', depth: 2 });
    const child = withReplies(mockComment({ id: 'child', depth: 1 }), [grandchild]);
    const parent = withReplies(mockComment({ id: 'parent' }), [child]);
    const flat = flattenCommentTree([parent]);
    expect(flat[0].childCount).toBe(2); // child + grandchild
    expect(flat[1].childCount).toBe(1); // grandchild only
    expect(flat[2].childCount).toBe(0); // leaf
  });

  it('auto-collapses AutoModerator comments', () => {
    const automod = withReplies(
      mockComment({ id: 'automod', author: 'AutoModerator' }),
      [mockComment({ id: 'reply', depth: 1 })],
    );
    const flat = flattenCommentTree([automod]);
    expect(flat[0].isCollapsed).toBe(true);
    expect(flat[1].isHidden).toBe(true); // child hidden because parent collapsed
  });

  it('inserts "more" placeholder for kind=more entries', () => {
    const parent = withMoreChildren(mockComment({ id: 'p1' }), ['x1', 'x2', 'x3'], 3);
    const flat = flattenCommentTree([parent]);
    expect(flat).toHaveLength(2); // parent + more placeholder
    const more = flat[1];
    expect(more.isMoreChildren).toBe(true);
    expect(more.moreChildrenIds).toEqual(['x1', 'x2', 'x3']);
    expect(more.moreCount).toBe(3);
  });

  it('caps at maxDepth with "Continue thread" entry', () => {
    // Create a chain 10 levels deep
    let current = mockComment({ id: 'd9', depth: 9 });
    for (let i = 8; i >= 0; i--) {
      current = withReplies(mockComment({ id: `d${i}`, depth: i }), [current]);
    }
    const flat = flattenCommentTree([current], 4);
    const continueEntry = flat.find((f) => f.isContinueThread);
    expect(continueEntry).toBeTruthy();
    expect(continueEntry!.depth).toBeLessThanOrEqual(5);
  });

  it('handles empty body (deleted comments)', () => {
    const deleted = mockComment({ id: 'del', body: '', author: '[deleted]' });
    const flat = flattenCommentTree([deleted]);
    expect(flat).toHaveLength(1);
    expect(flat[0].comment.body).toBe('');
  });

  it('handles replies that are empty string', () => {
    const comment = mockComment({ id: 'leaf', replies: '' });
    const flat = flattenCommentTree([comment]);
    expect(flat).toHaveLength(1);
    expect(flat[0].childCount).toBe(0);
  });
});

describe('toggleCollapse', () => {
  it('hides all children when collapsing', () => {
    const child1 = mockComment({ id: 'c1', depth: 1 });
    const child2 = mockComment({ id: 'c2', depth: 1 });
    const parent = withReplies(mockComment({ id: 'p' }), [child1, child2]);
    const flat = flattenCommentTree([parent]);

    const collapsed = toggleCollapse(flat, 'p');
    expect(collapsed[0].isCollapsed).toBe(true);
    expect(collapsed[1].isHidden).toBe(true);
    expect(collapsed[2].isHidden).toBe(true);
  });

  it('shows all children when re-expanding', () => {
    const child = mockComment({ id: 'c1', depth: 1 });
    const parent = withReplies(mockComment({ id: 'p' }), [child]);
    let flat = flattenCommentTree([parent]);

    flat = toggleCollapse(flat, 'p'); // collapse
    flat = toggleCollapse(flat, 'p'); // expand
    expect(flat[0].isCollapsed).toBe(false);
    expect(flat[1].isHidden).toBe(false);
  });

  it('does not affect siblings', () => {
    const sibling = mockComment({ id: 's1' });
    const childOfTarget = mockComment({ id: 'c1', depth: 1 });
    const target = withReplies(mockComment({ id: 'p' }), [childOfTarget]);
    const flat = flattenCommentTree([target, sibling]);

    const collapsed = toggleCollapse(flat, 'p');
    expect(collapsed.find((f) => f.comment.id === 's1')!.isHidden).toBe(false);
  });

  it('handles nested collapses (parent + child both collapsed)', () => {
    const grandchild = mockComment({ id: 'gc', depth: 2 });
    const child = withReplies(mockComment({ id: 'c', depth: 1 }), [grandchild]);
    const parent = withReplies(mockComment({ id: 'p' }), [child]);
    let flat = flattenCommentTree([parent]);

    // Collapse child first, then parent
    flat = toggleCollapse(flat, 'c');
    flat = toggleCollapse(flat, 'p');
    // Expand parent — child should be visible but grandchild stays hidden (child is still collapsed)
    flat = toggleCollapse(flat, 'p');
    expect(flat[1].isHidden).toBe(false); // child visible
    expect(flat[1].isCollapsed).toBe(true); // child still collapsed
    expect(flat[2].isHidden).toBe(true); // grandchild hidden (child is collapsed)
  });

  it('returns unchanged array if comment not found', () => {
    const flat = flattenCommentTree([mockComment({ id: 'x' })]);
    const result = toggleCollapse(flat, 'nonexistent');
    expect(result).toEqual(flat);
  });
});

describe('visible filtering', () => {
  it('filters out hidden items', () => {
    const child = mockComment({ id: 'c', depth: 1 });
    const parent = withReplies(mockComment({ id: 'p' }), [child]);
    let flat = flattenCommentTree([parent]);
    flat = toggleCollapse(flat, 'p');

    const visible = flat.filter((f) => !f.isHidden);
    expect(visible).toHaveLength(1);
    expect(visible[0].comment.id).toBe('p');
  });
});

describe('insertMoreChildren', () => {
  it('replaces more placeholder with new comments', () => {
    const parent = withMoreChildren(mockComment({ id: 'p' }), ['x1', 'x2'], 2);
    const flat = flattenCommentTree([parent]);
    const moreItem = flat.find((f) => f.isMoreChildren);
    expect(moreItem).toBeTruthy();

    const newComments = [mockComment({ id: 'x1', depth: 1 }), mockComment({ id: 'x2', depth: 1 })];
    const result = insertMoreChildren(flat, moreItem!.comment.id, newComments);
    expect(result.find((f) => f.isMoreChildren)).toBeUndefined();
    expect(result.find((f) => f.comment.id === 'x1')).toBeTruthy();
    expect(result.find((f) => f.comment.id === 'x2')).toBeTruthy();
  });

  it('returns unchanged array if placeholder not found', () => {
    const flat = flattenCommentTree([mockComment({ id: 'p' })]);
    const result = insertMoreChildren(flat, 'nonexistent_more', []);
    expect(result).toEqual(flat);
  });
});

describe('flattenCommentTree edge cases', () => {
  it('handles maxDepth=1', () => {
    const child = withReplies(mockComment({ id: 'child', depth: 1 }), [mockComment({ id: 'gc', depth: 2 })]);
    const parent = withReplies(mockComment({ id: 'parent' }), [child]);
    const flat = flattenCommentTree([parent], 1);
    const continueEntry = flat.find((f) => f.isContinueThread);
    expect(continueEntry).toBeTruthy();
  });
});
