/**
 * Export utilities — convert post arrays to JSON, CSV, or Markdown.
 * Pure functions, no side effects.
 */

import type { LocalPost } from '@/db/likes';

export function exportAsJSON(posts: LocalPost[]): string {
  return JSON.stringify(posts, null, 2);
}

export function exportAsCSV(posts: LocalPost[]): string {
  const headers = ['id', 'title', 'author', 'subreddit', 'url', 'score', 'num_comments', 'created_utc', 'permalink', 'flair'];
  const escapeCSV = (val: string | number | null | undefined): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const rows = posts.map((p) =>
    headers.map((h) => escapeCSV((p as any)[h])).join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportAsMarkdown(posts: LocalPost[]): string {
  if (posts.length === 0) return '# Exported Posts\n\nNo posts to export.';
  return posts.map((p) =>
    `## ${p.title}\n` +
    `- **Author:** u/${p.author}\n` +
    `- **Subreddit:** r/${p.subreddit}\n` +
    `- **Score:** ${p.score} | **Comments:** ${p.num_comments}\n` +
    `- **URL:** ${p.url}\n` +
    `- **Permalink:** https://reddit.com${p.permalink}\n` +
    (p.flair ? `- **Flair:** ${p.flair}\n` : ''),
  ).join('\n---\n\n');
}
