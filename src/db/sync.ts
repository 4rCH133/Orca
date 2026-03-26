/**
 * Activity sync — fetches user's upvoted/downvoted/saved history from Reddit API
 * and indexes into local SQLite for offline search.
 *
 * Rate limited: 2-second delay between requests to stay within Reddit's 60 req/min.
 * Supports full sync (all pages) and incremental sync (first 2 pages only).
 * Reports progress via syncStore for UI display.
 */

import { getUpvotedPosts, getDownvotedPosts, getSavedPosts, PostData, RedditListing } from '@/api/reddit';
import { upsertLikedPost, upsertDownvotedPost, upsertSavedPost } from './likes';
import { useSyncStore } from '@/store/syncStore';
import { MOCK_MODE } from '@/dev';

const RATE_LIMIT_DELAY = 2000; // 2s between API requests

/**
 * Paginate through a Reddit listing endpoint with rate limiting.
 */
async function fetchAllPages(
  fetcher: (after?: string) => Promise<RedditListing>,
  maxPages = 10,
  onPage?: (pageNum: number) => void,
): Promise<PostData[]> {
  const posts: PostData[] = [];
  let after: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const listing = await fetcher(after);
    const items = listing.data.children
      .filter((c) => c.kind === 't3')
      .map((c) => c.data as PostData);
    posts.push(...items);
    onPage?.(page + 1);

    if (!listing.data.after) break;
    after = listing.data.after;

    // Rate limit: wait between requests
    if (page < maxPages - 1 && listing.data.after) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY));
    }
  }

  return posts;
}

type SyncPhase = 'upvoted' | 'downvoted' | 'saved';

/**
 * Full sync — fetches all available pages (up to maxPages) for each category.
 */
export async function syncUserActivity(
  username: string,
  maxPages = 10,
): Promise<{ upvoted: number; downvoted: number; saved: number }> {
  if (MOCK_MODE) {
    useSyncStore.getState().setSyncComplete({ upvoted: 0, downvoted: 0, saved: 0 });
    return { upvoted: 0, downvoted: 0, saved: 0 };
  }

  const store = useSyncStore.getState();
  store.startSync();
  const totals = { upvoted: 0, downvoted: 0, saved: 0 };

  // Sync upvoted
  try {
    const upvoted = await fetchAllPages(
      (after) => getUpvotedPosts(username, after, 100),
      maxPages,
      (page) => store.setProgress(page, maxPages, 'upvoted'),
    );
    for (const post of upvoted) await upsertLikedPost(post);
    totals.upvoted = upvoted.length;
  } catch (e: any) {
    if (e?.message?.includes('403')) {
      console.warn('[Orca] Upvote history is private — skipping');
    } else {
      console.warn('[Orca] Sync upvoted failed:', e);
    }
  }

  // Sync downvoted
  try {
    const downvoted = await fetchAllPages(
      (after) => getDownvotedPosts(username, after, 100),
      maxPages,
      (page) => store.setProgress(page, maxPages, 'downvoted'),
    );
    for (const post of downvoted) await upsertDownvotedPost(post);
    totals.downvoted = downvoted.length;
  } catch (e: any) {
    if (e?.message?.includes('403')) {
      console.warn('[Orca] Downvote history is private — skipping');
    } else {
      console.warn('[Orca] Sync downvoted failed:', e);
    }
  }

  // Sync saved
  try {
    const saved = await fetchAllPages(
      (after) => getSavedPosts(username, after, 100),
      maxPages,
      (page) => store.setProgress(page, maxPages, 'saved'),
    );
    for (const post of saved) await upsertSavedPost(post);
    totals.saved = saved.length;
  } catch (e: any) {
    console.warn('[Orca] Sync saved failed:', e);
  }

  store.setSyncComplete(totals);
  console.log(`[Orca] Sync complete: ${totals.upvoted} upvoted, ${totals.downvoted} downvoted, ${totals.saved} saved`);
  return totals;
}

/**
 * Incremental sync — fetches only first 2 pages per category (most recent ~50 items).
 * Used for periodic background updates every 30 minutes.
 */
export async function syncIncrementalActivity(username: string): Promise<void> {
  await syncUserActivity(username, 2);
}
