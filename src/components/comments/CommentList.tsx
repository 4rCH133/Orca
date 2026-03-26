/**
 * CommentList — FlashList-based virtualized comment renderer.
 * Flattens Reddit's nested tree into a flat array for windowed rendering.
 * Supports pull-to-refresh and re-flattens when comment data changes.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { SwipeableComment } from './SwipeableComment';
import { flattenCommentTree, toggleCollapse, type FlatComment } from '@/utils/commentTree';
import { useVoteComment, useLoadMoreChildren } from '@/api/queries/comments';
import type { CommentData } from '@/api/reddit';
import { useTheme, useThemedStyles } from '@/theme/useTheme';

interface CommentListProps {
  comments: CommentData[];
  postId: string;
  onReply: (parentId: string, parentBody?: string) => void;
  ListHeaderComponent?: React.ReactElement;
  isRefetching?: boolean;
  onRefresh?: () => void;
}

export function CommentList({ comments, postId, onReply, ListHeaderComponent, isRefetching, onRefresh }: CommentListProps) {
  const [flatComments, setFlatComments] = useState<FlatComment[]>(() =>
    flattenCommentTree(comments),
  );
  const { mutate: voteComment } = useVoteComment(postId);
  const { mutate: loadMore } = useLoadMoreChildren(postId);
  const { theme } = useTheme();

  // Re-flatten when comments data changes (e.g., after refetch), preserving collapse state
  useEffect(() => {
    setFlatComments((prev) => {
      const collapsedIds = new Set(prev.filter((f) => f.isCollapsed).map((f) => f.comment.id));
      const fresh = flattenCommentTree(comments);
      if (collapsedIds.size === 0) return fresh;
      // Re-apply collapse state and recalculate hidden flags
      let result = fresh.map((f) => ({
        ...f,
        isCollapsed: collapsedIds.has(f.comment.id) ? true : f.isCollapsed,
      }));
      // Re-run visibility for each collapsed comment
      for (const id of collapsedIds) {
        result = toggleCollapse(toggleCollapse(result, id), id); // expand then collapse to fix isHidden
        // Actually: just collapse — toggleCollapse handles isHidden
        const idx = result.findIndex((f) => f.comment.id === id);
        if (idx !== -1 && !result[idx].isCollapsed) {
          result = toggleCollapse(result, id); // ensure collapsed
        }
      }
      return result;
    });
  }, [comments]);

  const s = useThemedStyles((t) => ({
    divider: { height: 1, backgroundColor: t.colors.bg.subtle },
    empty: { ...t.typography.body, color: t.colors.text.muted, textAlign: 'center' as const, marginTop: 24, padding: 32 },
  }));

  const visibleComments = useMemo(
    () => flatComments.filter((c) => !c.isHidden),
    [flatComments],
  );

  const handleToggleCollapse = useCallback((id: string) => {
    setFlatComments((prev) => toggleCollapse(prev, id));
  }, []);

  const handleVote = useCallback((id: string, dir: 1 | 0 | -1) => {
    setFlatComments((prev) => prev.map((f) => {
      if (f.comment.id !== id) return f;
      const oldDir = f.comment.likes === true ? 1 : f.comment.likes === false ? -1 : 0;
      return {
        ...f,
        comment: {
          ...f.comment,
          likes: dir === 1 ? true : dir === -1 ? false : null,
          score: f.comment.score + (dir - oldDir),
        },
      };
    }));
    voteComment({ id, direction: dir });
  }, [voteComment]);

  const handleLoadMore = useCallback((ids: string[], parentId: string) => {
    loadMore({ childIds: ids });
  }, [loadMore]);

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={isRefetching ?? false}
      onRefresh={onRefresh}
      tintColor={theme.colors.accent.ocean}
    />
  ) : undefined;

  if (comments.length === 0) {
    return (
      <FlashList
        data={[]}
        renderItem={() => null}
        estimatedItemSize={80}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={<Text style={s.empty}>No comments yet.</Text>}
        refreshControl={refreshControl}
      />
    );
  }

  return (
    <FlashList
      data={visibleComments}
      keyExtractor={(item) => item.comment.id}
      estimatedItemSize={80}
      renderItem={({ item }) => (
        <SwipeableComment
          item={item}
          onToggleCollapse={handleToggleCollapse}
          onVote={handleVote}
          onReply={onReply}
          onLoadMore={handleLoadMore}
        />
      )}
      ListHeaderComponent={ListHeaderComponent}
      ItemSeparatorComponent={() => <View style={s.divider} />}
      refreshControl={refreshControl}
    />
  );
}
