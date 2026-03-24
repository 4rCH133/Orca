import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getFeed, getSubredditFeed, votePost, savePost, FeedSort, PostData, RedditListing } from '@/api/reddit';
import { upsertSavedPost, removeSavedPost } from '@/db/likes';
import { MOCK_MODE, mockPosts } from '@/dev';

// Wrap mock posts in the shape useInfiniteQuery expects
function mockListing(): RedditListing {
  return {
    data: {
      after: null,
      before: null,
      children: mockPosts.map((p) => ({ kind: 't3', data: p })),
    },
  };
}

// ---- Home feed ----

export function useHomeFeed(sort: FeedSort = 'best') {
  return useInfiniteQuery({
    queryKey: ['feed', 'home', sort],
    queryFn: MOCK_MODE ? () => Promise.resolve(mockListing()) : ({ pageParam }) => getFeed(sort, pageParam as string | undefined),
    getNextPageParam: (last) => last.data.after ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2,
  });
}

// ---- Subreddit feed ----

export function useSubredditFeed(subreddit: string, sort: FeedSort = 'hot') {
  return useInfiniteQuery({
    queryKey: ['feed', 'subreddit', subreddit, sort],
    queryFn: MOCK_MODE ? () => Promise.resolve(mockListing()) : ({ pageParam }) => getSubredditFeed(subreddit, sort, pageParam as string | undefined),
    getNextPageParam: (last) => last.data.after ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2,
  });
}

// ---- Vote ----

export function useVotePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: 1 | 0 | -1 }) => {
      if (MOCK_MODE) return Promise.resolve();
      return votePost(id, direction);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

// ---- Save ----

export function useSavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, save, post }: { id: string; save: boolean; post: PostData }) => {
      if (MOCK_MODE) return Promise.resolve();
      return savePost(id, save);
    },
    onMutate: async ({ save, post }) => {
      if (save) {
        await upsertSavedPost(post);
      } else {
        await removeSavedPost(post.id);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved'] }),
  });
}
