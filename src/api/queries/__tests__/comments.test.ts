import { updateCommentVote } from '../comments';
import type { CommentData, RedditListing } from '@/api/reddit';

function mockComment(overrides: Partial<CommentData> = {}): CommentData {
  return {
    id: 'c1',
    body: 'Test',
    author: 'user',
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

describe('updateCommentVote', () => {
  it('updates score and likes on the target comment', () => {
    const comment = mockComment({ id: 'target', score: 10, likes: null });
    const updated = updateCommentVote(comment, 'target', 1);
    expect(updated.likes).toBe(true);
    expect(updated.score).toBe(11); // null(0) → up(1) = +1
  });

  it('handles toggle from upvoted to unvoted', () => {
    const comment = mockComment({ id: 'target', score: 11, likes: true });
    const updated = updateCommentVote(comment, 'target', 0);
    expect(updated.likes).toBeNull();
    expect(updated.score).toBe(10); // up(1) → none(0) = -1
  });

  it('handles switch from upvoted to downvoted', () => {
    const comment = mockComment({ id: 'target', score: 11, likes: true });
    const updated = updateCommentVote(comment, 'target', -1);
    expect(updated.likes).toBe(false);
    expect(updated.score).toBe(9); // up(1) → down(-1) = -2
  });

  it('finds deeply nested comment by ID', () => {
    const grandchild = mockComment({ id: 'deep', score: 5, likes: null });
    const child = mockComment({
      id: 'mid',
      replies: {
        data: {
          after: null, before: null,
          children: [{ kind: 't1', data: grandchild }],
        },
      } as RedditListing,
    });
    const root = mockComment({
      id: 'root',
      replies: {
        data: {
          after: null, before: null,
          children: [{ kind: 't1', data: child }],
        },
      } as RedditListing,
    });

    const updated = updateCommentVote(root, 'deep', 1);
    // Navigate to the grandchild
    const midChild = (updated.replies as RedditListing).data.children[0].data as CommentData;
    const deepChild = (midChild.replies as RedditListing).data.children[0].data as CommentData;
    expect(deepChild.likes).toBe(true);
    expect(deepChild.score).toBe(6);
  });

  it('returns unchanged comment when target not found', () => {
    const comment = mockComment({ id: 'other', score: 10, likes: null });
    const updated = updateCommentVote(comment, 'nonexistent', 1);
    expect(updated).toEqual(comment);
  });

  it('handles comment with replies as empty string', () => {
    const comment = mockComment({ id: 'leaf', replies: '' });
    const updated = updateCommentVote(comment, 'leaf', 1);
    expect(updated.likes).toBe(true);
  });
});
