import { useQuery } from '@tanstack/react-query';
import { getPost, getSubredditInfo, PostData, CommentData } from '@/api/reddit';
import { MOCK_MODE, mockPosts, mockComments } from '@/dev';

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (MOCK_MODE) {
        const post = mockPosts.find((p) => p.id === postId) ?? mockPosts[0];
        return { post, comments: mockComments };
      }
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
    enabled: !MOCK_MODE,
  });
}
