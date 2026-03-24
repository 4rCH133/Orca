import { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Text, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useHomeFeed, useVotePost, useSavePost } from '@/api/queries/feed';
import { PostCard } from '@/components/feed/PostCard';
import type { FeedSort, PostData } from '@/api/reddit';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const SORTS: FeedSort[] = ['best', 'hot', 'new', 'top', 'rising'];

export default function HomeScreen() {
  const [sort, setSort] = useState<FeedSort>('best');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useHomeFeed(sort);
  const { mutate: vote } = useVotePost();
  const { mutate: save } = useSavePost();

  const posts = data?.pages.flatMap((p) =>
    p.data.children
      .filter((c) => c.kind === 't3')
      .map((c) => c.data as PostData)
  ) ?? [];

  const handleVote = useCallback(
    (id: string, dir: 1 | 0 | -1) => vote({ id, direction: dir }),
    [vote]
  );

  const handleSave = useCallback(
    (id: string, doSave: boolean) => {
      const post = posts.find((p) => p.id === id);
      if (post) save({ id, save: doSave, post });
    },
    [save, posts]
  );

  return (
    <View style={styles.container}>
      {/* Sort pill row */}
      <View style={styles.sortBar}>
        {SORTS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSort(s)}
            style={[styles.sortPill, sort === s && styles.sortPillActive]}
          >
            <Text style={[styles.sortLabel, sort === s && styles.sortLabelActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.primary} size="large" />
        </View>
      ) : (
        <FlashList
          data={posts}
          keyExtractor={(item) => item.id}
          estimatedItemSize={150}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <PostCard post={item} onVote={handleVote} onSave={handleSave} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent.primary}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.accent.primary} style={{ margin: 20 }} />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.bg.base,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: colors.bg.elevated,
  },
  sortPillActive: { backgroundColor: colors.accent.primary },
  sortLabel: { ...typography.label, color: colors.text.secondary },
  sortLabelActive: { color: '#FFFFFF' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border.default },
});
