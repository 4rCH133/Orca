/**
 * Comment query hooks — voting, submitting, loading more children.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voteComment, submitComment, getMoreChildren, type CommentData } from '@/api/reddit';
import { useToastStore } from '@/store/toastStore';
import { MOCK_MODE } from '@/dev';

// ---- Recursive helper to update a comment vote in the tree ----

export function updateCommentVote(
  comment: CommentData,
  targetId: string,
  direction: 1 | 0 | -1,
): CommentData {
  if (comment.id === targetId) {
    const oldDir = comment.likes === true ? 1 : comment.likes === false ? -1 : 0;
    return {
      ...comment,
      likes: direction === 1 ? true : direction === -1 ? false : null,
      score: comment.score + (direction - oldDir),
    };
  }
  if (comment.replies && typeof comment.replies !== 'string') {
    return {
      ...comment,
      replies: {
        ...comment.replies,
        data: {
          ...comment.replies.data,
          children: comment.replies.data.children.map((child) => ({
            ...child,
            data: updateCommentVote(child.data as CommentData, targetId, direction),
          })),
        },
      },
    };
  }
  return comment;
}

// ---- Vote on a comment (optimistic UI) ----

export function useVoteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 1 | 0 | -1 }) => {
      if (MOCK_MODE) return Promise.resolve();
      return voteComment(id, direction);
    },
    onMutate: ({ id, direction }) => {
      qc.setQueryData(['post', postId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          comments: old.comments.map((c: CommentData) =>
            updateCommentVote(c, id, direction),
          ),
        };
      });
    },
    onError: () => {
      useToastStore.getState().show('Vote failed — check your connection');
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

// ---- Submit a new comment (optimistic) ----

export function useSubmitComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ parentFullname, body }: { parentFullname: string; body: string }) => {
      if (MOCK_MODE) {
        // Return a fake comment for mock mode
        return Promise.resolve({
          id: `mock_${Date.now()}`,
          body,
          author: 'you',
          score: 1,
          created_utc: Date.now() / 1000,
          replies: '' as const,
          depth: 0,
          likes: true as boolean | null,
          is_submitter: false,
          edited: false as false | number,
        } satisfies CommentData);
      }
      return submitComment(parentFullname, body);
    },
    onSuccess: () => {
      // Refetch the post to get the real comment tree with the new comment
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

// ---- Load more children ----

export function useLoadMoreChildren(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ childIds }: { childIds: string[] }) => {
      if (MOCK_MODE) return Promise.resolve([]);
      return getMoreChildren(postId, childIds);
    },
    onSuccess: () => {
      // Refetch to get the updated tree
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}
