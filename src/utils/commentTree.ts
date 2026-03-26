/**
 * Comment tree flattening utilities.
 * Converts Reddit's nested comment tree into a flat array for FlashList rendering.
 * Pure functions — no React, no side effects, easy to test.
 */

import type { CommentData, RedditListing } from '@/api/reddit';

export interface FlatComment {
  /** The comment data from Reddit */
  comment: CommentData;
  /** Nesting depth (0 = top level) */
  depth: number;
  /** Total number of descendants */
  childCount: number;
  /** Whether this comment is collapsed by the user */
  isCollapsed: boolean;
  /** Whether this comment is hidden because an ancestor is collapsed */
  isHidden: boolean;
  /** Whether this is a "Load N more replies" placeholder */
  isMoreChildren: boolean;
  /** IDs to fetch when "Load more" is tapped */
  moreChildrenIds?: string[];
  /** Number of additional children */
  moreCount?: number;
  /** Whether this is a "Continue this thread →" placeholder */
  isContinueThread?: boolean;
}

/**
 * Flatten a Reddit comment tree into an array for FlashList.
 * @param comments Top-level comments from Reddit API
 * @param maxDepth Maximum visible nesting depth (deeper comments get "Continue thread")
 */
export function flattenCommentTree(
  comments: CommentData[],
  maxDepth = 8,
): FlatComment[] {
  const result: FlatComment[] = [];

  /** Walk a comment and its descendants. Returns total number of descendant items added. */
  function walk(comment: CommentData, depth: number, parentCollapsed: boolean): number {
    const isAutoMod = comment.author === 'AutoModerator';
    const isCollapsed = isAutoMod;
    const isHidden = parentCollapsed;

    const replies = getCommentReplies(comment);
    const moreEntry = getMoreEntry(comment);

    // Push this comment
    result.push({
      comment,
      depth,
      childCount: 0, // updated after processing descendants
      isCollapsed,
      isHidden,
      isMoreChildren: false,
    });
    const thisIndex = result.length - 1;
    let totalDescendants = 0;

    // Process children
    if (depth < maxDepth) {
      for (const reply of replies) {
        const subtreeCount = walk(reply, depth + 1, isHidden || isCollapsed);
        totalDescendants += 1 + subtreeCount; // the reply itself + its descendants
      }

      // "Load more" placeholder
      if (moreEntry) {
        result.push({
          comment: { id: `more_${comment.id}`, body: '', author: '', score: 0, created_utc: 0, replies: '', depth: depth + 1, likes: null, is_submitter: false, edited: false } as CommentData,
          depth: depth + 1,
          childCount: 0,
          isCollapsed: false,
          isHidden: isHidden || isCollapsed,
          isMoreChildren: true,
          moreChildrenIds: moreEntry.children,
          moreCount: moreEntry.count,
        });
        totalDescendants++;
      }
    } else if (replies.length > 0) {
      // "Continue this thread" placeholder
      result.push({
        comment: { id: `continue_${comment.id}`, body: '', author: '', score: 0, created_utc: 0, replies: '', depth: depth + 1, likes: null, is_submitter: false, edited: false } as CommentData,
        depth: depth + 1,
        childCount: 0,
        isCollapsed: false,
        isHidden: isHidden || isCollapsed,
        isMoreChildren: false,
        isContinueThread: true,
      });
      totalDescendants++;
    }

    // Update childCount (total descendants, not just direct children)
    result[thisIndex].childCount = totalDescendants;
    return totalDescendants;
  }

  for (const comment of comments) {
    walk(comment, 0, false);
  }

  return result;
}

/**
 * Toggle collapse state on a comment.
 * Returns a new array with children hidden/shown accordingly.
 */
export function toggleCollapse(flat: FlatComment[], commentId: string): FlatComment[] {
  const idx = flat.findIndex((f) => f.comment.id === commentId);
  if (idx === -1) return flat;

  const newFlat = flat.map((f) => ({ ...f }));
  const target = newFlat[idx];
  target.isCollapsed = !target.isCollapsed;

  const targetDepth = target.depth;
  const nowCollapsed = target.isCollapsed;

  // Walk all items after the target until we hit same-or-lesser depth
  for (let i = idx + 1; i < newFlat.length; i++) {
    if (newFlat[i].depth <= targetDepth) break;

    if (nowCollapsed) {
      // Collapsing: hide all descendants
      newFlat[i].isHidden = true;
    } else {
      // Expanding: show descendants, UNLESS they have another collapsed ancestor
      // Check if any ancestor between target and this item is collapsed
      let hasCollapsedAncestor = false;
      for (let j = i - 1; j > idx; j--) {
        if (newFlat[j].depth < newFlat[i].depth && newFlat[j].isCollapsed) {
          hasCollapsedAncestor = true;
          break;
        }
      }
      newFlat[i].isHidden = hasCollapsedAncestor;
    }
  }

  return newFlat;
}

/**
 * Insert loaded "more children" into the flat array, replacing the placeholder.
 */
export function insertMoreChildren(
  flat: FlatComment[],
  moreId: string,
  newComments: CommentData[],
  maxDepth = 8,
): FlatComment[] {
  const idx = flat.findIndex((f) => f.comment.id === moreId && f.isMoreChildren);
  if (idx === -1) return flat;

  const parentDepth = flat[idx].depth - 1;
  const newFlat = [...flat];

  // Flatten the new comments
  const inserted = flattenCommentTree(newComments, maxDepth - parentDepth);
  // Adjust depths relative to insertion point
  const adjusted = inserted.map((f) => ({
    ...f,
    depth: f.depth + flat[idx].depth,
  }));

  // Replace the "more" placeholder with the new comments
  newFlat.splice(idx, 1, ...adjusted);

  return newFlat;
}

// ---- Helpers ----

function getCommentReplies(comment: CommentData): CommentData[] {
  if (!comment.replies || typeof comment.replies === 'string') return [];
  return comment.replies.data.children
    .filter((c) => c.kind === 't1')
    .map((c) => c.data as CommentData);
}

function getMoreEntry(comment: CommentData): { children: string[]; count: number } | null {
  if (!comment.replies || typeof comment.replies === 'string') return null;
  const more = comment.replies.data.children.find((c) => c.kind === 'more');
  if (!more) return null;
  const data = more.data as any;
  return { children: data.children ?? [], count: data.count ?? 0 };
}
