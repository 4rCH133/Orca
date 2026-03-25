import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeed, getSubredditFeed, votePost, savePost, FeedSort, PostData, RedditListing } from '@/api/reddit';
import { upsertLikedPost, removeLikedPost, upsertSavedPost, removeSavedPost, upsertDownvotedPost, removeDownvotedPost } from '@/db/likes';
import { MOCK_MODE, mockPosts } from '@/dev';

function mockListing(): RedditListing {
  return {
    data: {
      after: null,
      before: null,
      children: mockPosts.map((p) => ({ kind: 't3', data: p })),
    },
  };
}

// ---- Optimistic helper: update a post inside all cached feed pages ----

function updatePostInCache(
  qc: ReturnType<typeof useQueryClient>,
  postId: string,
  updater: (post: PostData) => PostData,
) {
  // Update all feed queries (home, subreddit, etc.)
  qc.setQueriesData<{ pages: RedditListing[]; pageParams: unknown[] }>(
    { queryKey: ['feed'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: {
            ...page.data,
            children: page.data.children.map((child) => {
              if (child.kind === 't3' && (child.data as PostData).id === postId) {
                return { ...child, data: updater(child.data as PostData) };
              }
              return child;
            }),
          },
        })),
      };
    },
  );
}

// ---- Home feed ----

export function useHomeFeed(sort: FeedSort = 'best') {
  return useInfiniteQuery({
    queryKey: ['feed', 'home', sort],
    queryFn: MOCK_MODE
      ? () => Promise.resolve(mockListing())
      : ({ pageParam }) => getFeed(sort, pageParam as string | undefined),
    getNextPageParam: (last) => last.data.after ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2,
  });
}

// ---- Subreddit feed ----

export function useSubredditFeed(subreddit: string, sort: FeedSort = 'hot') {
  return useInfiniteQuery({
    queryKey: ['feed', 'subreddit', subreddit, sort],
    queryFn: MOCK_MODE
      ? () => Promise.resolve(mockListing())
      : ({ pageParam }) => getSubredditFeed(subreddit, sort, pageParam as string | undefined),
    getNextPageParam: (last) => last.data.after ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2,
  });
}

// ---- Vote (with optimistic UI + local SQLite sync) ----

export function useVotePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 1 | 0 | -1; post: PostData }) => {
      if (MOCK_MODE) return Promise.resolve();
      return votePost(id, direction);
    },
    onMutate: async ({ id, direction, post }) => {
      const oldLikes = post.likes;

      // Optimistic: update cached posts immediately
      updatePostInCache(qc, id, (p) => {
        const oldDir = p.likes === true ? 1 : p.likes === false ? -1 : 0;
        const scoreDelta = direction - oldDir;
        return {
          ...p,
          likes: direction === 1 ? true : direction === -1 ? false : null,
          score: p.score + scoreDelta,
        };
      });

      // Sync to local SQLite for offline searchable history:
      // Upvote (dir=1): add to liked_posts, remove from downvoted_posts
      // Downvote (dir=-1): add to downvoted_posts, remove from liked_posts
      // Unvote (dir=0): remove from both
      if (direction === 1) {
        await upsertLikedPost(post);
        await removeDownvotedPost(id);
      } else if (direction === -1) {
        await upsertDownvotedPost(post);
        await removeLikedPost(id);
      } else {
        // Unvoting — remove from whichever table it was in
        if (oldLikes === true) await removeLikedPost(id);
        if (oldLikes === false) await removeDownvotedPost(id);
      }
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ---- Save (with optimistic UI) ----

export function useSavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, save }: { id: string; save: boolean; post: PostData }) => {
      if (MOCK_MODE) return Promise.resolve();
      return savePost(id, save);
    },
    onMutate: async ({ id, save, post }) => {
      // Optimistic: update saved state in cached posts
      updatePostInCache(qc, id, (p) => ({ ...p, saved: save }));

      // Sync to local SQLite
      if (save) {
        await upsertSavedPost(post);
      } else {
        await removeSavedPost(post.id);
      }
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}
