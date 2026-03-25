/**
 * Subreddit query hooks — rules, flairs, subscribe, flair-filtered feed.
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSubredditRules,
  subscribeSubreddit,
  getSubredditFlairs,
  searchSubredditByFlair,
  type FeedSort,
  type RedditListing,
} from '@/api/reddit';
import { MOCK_MODE, mockSubreddits } from '@/dev';

export function useSubredditRules(subreddit: string) {
  return useQuery({
    queryKey: ['subreddit', 'rules', subreddit],
    queryFn: MOCK_MODE
      ? () => Promise.resolve({
          rules: [
            { short_name: 'Be respectful', description: 'Treat others with respect.', kind: 'all' as const, violation_reason: 'Disrespectful' },
            { short_name: 'No spam', description: 'No spam or self-promotion.', kind: 'all' as const, violation_reason: 'Spam' },
            { short_name: 'Relevant content', description: 'Posts must be relevant to the subreddit topic.', kind: 'link' as const, violation_reason: 'Off-topic' },
          ],
        })
      : () => getSubredditRules(subreddit),
    staleTime: 1000 * 60 * 30,
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subreddit, action }: { subreddit: string; action: 'sub' | 'unsub' }) => {
      if (MOCK_MODE) return Promise.resolve();
      return subscribeSubreddit(subreddit, action);
    },
    onMutate: ({ subreddit, action }) => {
      qc.setQueryData(['subreddit', subreddit], (old: any) => {
        if (!old) return old;
        return { ...old, data: { ...old.data, user_is_subscriber: action === 'sub' } };
      });
    },
    onError: (_, { subreddit }) => {
      qc.invalidateQueries({ queryKey: ['subreddit', subreddit] });
    },
  });
}

export function useSubredditFlairs(subreddit: string) {
  return useQuery({
    queryKey: ['subreddit', 'flairs', subreddit],
    queryFn: MOCK_MODE
      ? () => Promise.resolve([
          { text: 'Discussion', id: 'flair_discussion' },
          { text: 'News', id: 'flair_news' },
          { text: 'Image', id: 'flair_image' },
          { text: 'Question', id: 'flair_question' },
        ])
      : () => getSubredditFlairs(subreddit),
    staleTime: 1000 * 60 * 30,
  });
}

export function useSubredditFlairFeed(subreddit: string, flair: string, sort: FeedSort = 'new') {
  return useInfiniteQuery({
    queryKey: ['feed', 'subreddit', subreddit, 'flair', flair, sort],
    queryFn: ({ pageParam }) => searchSubredditByFlair(subreddit, flair, sort, pageParam as string | undefined),
    getNextPageParam: (last: RedditListing) => last.data.after ?? undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2,
    enabled: !MOCK_MODE && flair.length > 0,
  });
}
