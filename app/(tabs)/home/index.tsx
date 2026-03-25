import { useState, useCallback, useRef } from 'react';
import { View, ActivityIndicator, Pressable, Text, RefreshControl } from 'react-native';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useScrollToTop } from '@react-navigation/native';
import { useHomeFeed, useVotePost, useSavePost } from '@/api/queries/feed';
import { PostCard } from '@/components/feed/PostCard';
import type { FeedSort, PostData } from '@/api/reddit';
import { useThemedStyles } from '@/theme/useTheme';
import { useUIStore } from '@/store/uiStore';

const SORTS: FeedSort[] = ['best', 'hot', 'new', 'top', 'rising'];

export default function HomeScreen() {
  const [sort, setSort] = useState<FeedSort>('best');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useHomeFeed(sort);
  const { mutate: vote } = useVotePost();
  const { mutate: save } = useSavePost();

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base },
    center: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
    sortBar: {
      flexDirection: 'row' as const,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: t.colors.border.default,
      backgroundColor: t.colors.bg.base,
    },
    sortPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: t.colors.bg.elevated,
    },
    sortPillActive: { backgroundColor: t.colors.accent.ocean },
    sortLabel: { ...t.typography.label, color: t.colors.text.secondary },
    sortLabelActive: { color: '#FFFFFF' },
    separator: { height: 0.5, backgroundColor: t.colors.border.default },
  }));

  const accentColor = useThemedStyles((t) => ({ c: { color: t.colors.accent.ocean } })).c.color as string;

  // Scroll-to-top on tab re-press
  const listRef = useRef<FlashList<PostData>>(null);
  useScrollToTop(useRef({ scrollToOffset: (opts: { offset: number; animated: boolean }) => listRef.current?.scrollToOffset(opts) }));

  // Hide-on-scroll tab bar
  const lastOffsetRef = useRef(0);
  const setTabBarVisible = useUIStore.getState().setTabBarVisible;
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastOffsetRef.current;
    if (delta > 50 && y > 100) {
      setTabBarVisible(false);
      lastOffsetRef.current = y;
    } else if (delta < -20) {
      setTabBarVisible(true);
      lastOffsetRef.current = y;
    }
  }, [setTabBarVisible]);

  const posts = data?.pages.flatMap((p) =>
    p.data.children
      .filter((c) => c.kind === 't3')
      .map((c) => c.data as PostData)
  ) ?? [];

  const handleVote = useCallback(
    (id: string, dir: 1 | 0 | -1) => {
      const post = posts.find((p) => p.id === id);
      if (post) vote({ id, direction: dir, post });
    },
    [vote, posts]
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
          <ActivityIndicator color={accentColor} size="large" />
        </View>
      ) : (
        <FlashList
          ref={listRef}
          data={posts}
          keyExtractor={(item) => item.id}
          estimatedItemSize={150}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <PostCard post={item} onVote={handleVote} onSave={handleSave} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={accentColor}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={accentColor} style={{ margin: 20 }} />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}
