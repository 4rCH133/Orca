import { formatDistanceToNowStrict } from 'date-fns';

export function formatScore(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatTimeAgo(utcSeconds: number): string {
  return formatDistanceToNowStrict(new Date(utcSeconds * 1000), { addSuffix: true });
}
