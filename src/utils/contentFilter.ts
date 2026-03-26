/**
 * Content Filtering Engine — pure utility, no React, no DB.
 * Filters posts client-side based on user-configured rules.
 * Supports: keyword, domain, username, subreddit, flair matching.
 * Supports regex filters with graceful error handling.
 */

import type { PostData } from '@/api/reddit';

export interface ContentFilter {
  id: string;
  type: 'keyword' | 'domain' | 'username' | 'subreddit' | 'flair';
  value: string;
  scope: string; // 'all' or specific subreddit name
  is_regex: boolean;
  enabled: boolean;
  match_count: number;
}

export interface FilterResult {
  visible: PostData[];
  filteredCount: number;
  filteredIds: Set<string>;
}

/**
 * Extract domain from a URL, stripping 'www.' prefix.
 * Returns empty string on invalid/missing URL.
 */
function extractDomain(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Check if a single filter matches a post.
 */
function matchesFilter(post: PostData, filter: ContentFilter): boolean {
  // Skip disabled filters
  if (!filter.enabled) return false;

  // Skip empty value filters
  if (!filter.value) return false;

  // Scope check: if filter is scoped to a specific subreddit, only apply there
  if (filter.scope !== 'all' && post.subreddit.toLowerCase() !== filter.scope.toLowerCase()) {
    return false;
  }

  switch (filter.type) {
    case 'keyword': {
      if (filter.is_regex) {
        try {
          return new RegExp(filter.value, 'i').test(post.title);
        } catch {
          return false; // invalid regex — treat as non-match, don't crash
        }
      }
      return post.title.toLowerCase().includes(filter.value.toLowerCase());
    }

    case 'domain': {
      if (post.is_self) return false; // self posts have no external domain
      const domain = extractDomain(post.url);
      return domain.toLowerCase() === filter.value.toLowerCase();
    }

    case 'username': {
      return post.author.toLowerCase() === filter.value.toLowerCase();
    }

    case 'subreddit': {
      return post.subreddit.toLowerCase() === filter.value.toLowerCase();
    }

    case 'flair': {
      return (post.link_flair_text ?? '').toLowerCase() === filter.value.toLowerCase();
    }

    default:
      return false;
  }
}

/**
 * Apply all enabled filters to a list of posts.
 * A post is hidden if ANY enabled filter matches it (OR logic).
 *
 * @returns visible posts, count of filtered posts, and set of filtered post IDs
 */
export function applyFilters(posts: PostData[], filters: ContentFilter[]): FilterResult {
  const enabledFilters = filters.filter((f) => f.enabled && f.value);

  if (enabledFilters.length === 0) {
    return { visible: posts, filteredCount: 0, filteredIds: new Set() };
  }

  const filteredIds = new Set<string>();
  const visible: PostData[] = [];

  for (const post of posts) {
    const matched = enabledFilters.some((f) => matchesFilter(post, f));
    if (matched) {
      filteredIds.add(post.id);
    } else {
      visible.push(post);
    }
  }

  return { visible, filteredCount: filteredIds.size, filteredIds };
}
