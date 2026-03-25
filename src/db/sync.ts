/**
 * Bulk sync: fetch user's upvoted/downvoted/saved history from Reddit API
 * and backfill into local SQLite for offline search.
 *
 * Reddit API returns max 100 items per request, paginated with `after` cursor.
 * Reddit limits access to the last ~1000 items per category.
 *
 * This should be called:
 * - On first login (initial sync)
 * - Periodically in background (incremental sync)
 * - When user manually triggers sync from settings
 */

import { getUpvotedPosts, getDownvotedPosts, getSavedPosts, PostData, RedditListing } from '@/api/reddit';
import { upsertLikedPost, upsertDownvotedPost, upsertSavedPost } from './likes';
import { MOCK_MODE } from '@/dev';

interface SyncProgress {
  upvoted: number;
  downvoted: number;
  saved: number;
  done: boolean;
}

/**
 * Paginate through a Reddit listing endpoint, collecting all post items.
 * Stops when there's no `after` cursor or we hit maxPages (safety limit).
 */
async function fetchAllPages(
  fetcher: (after?: string) => Promise<RedditListing>,
  maxPages = 10,
): Promise<PostData[]> {
  const posts: PostData[] = [];
  let after: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const listing = await fetcher(after);
    const items = listing.data.children
      .filter((c) => c.kind === 't3')
      .map((c) => c.data as PostData);
    posts.push(...items);

    if (!listing.data.after) break;
    after = listing.data.after;
  }

  return posts;
}

/**
 * Full sync of user's Reddit activity into local SQLite.
 * Returns count of items synced per category.
 */
export async function syncUserActivity(
  username: string,
  onProgress?: (progress: SyncProgress) => void,
): Promise<SyncProgress> {
  if (MOCK_MODE) {
    return { upvoted: 0, downvoted: 0, saved: 0, done: true };
  }

  const progress: SyncProgress = { upvoted: 0, downvoted: 0, saved: 0, done: false };

  // Sync upvoted posts
  try {
    const upvoted = await fetchAllPages((after) => getUpvotedPosts(username, after, 100));
    for (const post of upvoted) {
      await upsertLikedPost(post);
    }
    progress.upvoted = upvoted.length;
    onProgress?.({ ...progress });
  } catch (e) {
    console.warn('[Orca] Sync upvoted failed:', e);
  }

  // Sync downvoted posts
  try {
    const downvoted = await fetchAllPages((after) => getDownvotedPosts(username, after, 100));
    for (const post of downvoted) {
      await upsertDownvotedPost(post);
    }
    progress.downvoted = downvoted.length;
    onProgress?.({ ...progress });
  } catch (e) {
    console.warn('[Orca] Sync downvoted failed:', e);
  }

  // Sync saved posts
  try {
    const saved = await fetchAllPages((after) => getSavedPosts(username, after, 100));
    for (const post of saved) {
      await upsertSavedPost(post);
    }
    progress.saved = saved.length;
    onProgress?.({ ...progress });
  } catch (e) {
    console.warn('[Orca] Sync saved failed:', e);
  }

  progress.done = true;
  onProgress?.(progress);
  return progress;
}
