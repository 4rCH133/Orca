// Re-export API types for convenience
export type { PostData, CommentData, RedditUser, SubredditData } from '@/api/reddit';

// App-specific types
export interface AppRoute {
  subreddit: string;
  postId?: string;
}
