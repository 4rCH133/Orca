import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeed, getSubredditFeed, votePost, savePost, FeedSort, PostData } from '@/api/reddit';
import { upsertLikedPost, removeLikedPost, upsertSavedPost, removeSavedPost } from '@/db/likes';

// ---- Home feed ----

export function useHomeFeed(sort: FeedSort = 'best') {
  return useInfiniteQuery({
    queryKey: ['feed', 'home', sort],
    queryFn: ({ pageParam }) => getFeed(sort, pageParam as string | undefined),
    getNextPageParam: (last) => last.data.after ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ---- Subreddit feed ----

export function useSubredditFeed(subreddit: string, sort: FeedSort = 'hot') {
  return useInfiniteQuery({
    queryKey: ['feed', 'subreddit', subreddit, sort],
    queryFn: ({ pageParam }) => getSubredditFeed(subreddit, sort, pageParam as string | undefined),
    getNextPageParam: (last) => last.data.after ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2,
  });
}

// ---- Vote ----

export function useVotePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 1 | 0 | -1 }) =>
      votePost(id, direction),
    onSuccess: async (_, { id, direction }) => {
      // Sync to local DB: upvote = liked, downvote/none = remove
      // You'll need to pass the full post here; this is simplified
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ---- Save ----

export function useSavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, save, post }: { id: string; save: boolean; post: PostData }) =>
      savePost(id, save),
    onMutate: async ({ save, post }) => {
      if (save) {
        await upsertSavedPost(post);
      } else {
        await removeSavedPost(post.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}
