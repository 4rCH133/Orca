import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPost, getSubredditInfo, votePost, savePost, PostData, CommentData } from '@/api/reddit';
import { withCache, CacheKeys } from '@/lib/redis';

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const [postListing, commentListing] = await getPost(postId);
      const post = postListing.data.children[0].data as PostData;
      const comments = commentListing.data.children.map((c) => c.data as CommentData);
      return { post, comments };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSubredditInfo(subreddit: string) {
  return useQuery({
    queryKey: ['subreddit', subreddit],
    queryFn: () => getSubredditInfo(subreddit),
    staleTime: 1000 * 60 * 10,
  });
}
