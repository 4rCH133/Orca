import { useState, useCallback, useRef } from 'react';
import { View, ActivityIndicator, Pressable, Text, RefreshControl } from 'react-native';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useScrollToTop } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { LayoutGrid, AlignJustify, LayoutList } from 'lucide-react-native';
import { useHomeFeed, useVotePost, useSavePost } from '@/api/queries/feed';
import { PostCard } from '@/components/feed/PostCard';
import { PostCardCompact } from '@/components/feed/PostCardCompact';
import { PostCardList } from '@/components/feed/PostCardList';
import { FeedSkeleton } from '@/components/ui/FeedSkeleton';
import { getReadIds } from '@/db/readPosts';
import type { FeedSort, PostData } from '@/api/reddit';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getLayoutForFeed, setLayoutForFeed } from '@/store/settingsStore';

type FeedLayout = 'card' | 'compact' | 'list';
const SORTS: FeedSort[] = ['best', 'hot', 'new', 'top', 'rising'];

const LAYOUT_CYCLE: Record<FeedLayout, FeedLayout> = {
  card: 'compact',
  compact: 'list',
  list: 'card',
};

const ESTIMATED_SIZE: Record<FeedLayout, number> = {
  card: 200,
  compact: 64,
  list: 100,
};

export default function HomeScreen() {
  const [sort, setSort] = useState<FeedSort>('best');
  const [layout, setLayout] = useState<FeedLayout>(() => getLayoutForFeed('home'));
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dimReadPosts = useSettingsStore((s) => s.dimReadPosts);
  const hideReadPosts = useSettingsStore((s) => s.hideReadPosts);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useHomeFeed(sort);
  const { mutate: vote } = useVotePost();
  const { mutate: save } = useSavePost();
  const { theme } = useTheme();

  // Refresh read IDs whenever screen gains focus (e.g., returning from post detail)
  useFocusEffect(useCallback(() => {
    getReadIds().then(setReadIds);
  }, []));

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base },
    sortBar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: t.colors.border.default,
      backgroundColor: t.colors.bg.base,
    },
    sortPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: t.colors.bg.elevated },
    sortPillActive: { backgroundColor: t.colors.accent.ocean },
    sortLabel: { ...t.typography.label, color: t.colors.text.secondary },
    sortLabelActive: { color: '#FFFFFF' },
    layoutBtn: { marginLeft: 'auto' as any, padding: 6 },
    separator: { height: 0.5, backgroundColor: t.colors.border.default },
  }));

  const accentColor = theme.colors.accent.ocean;

  // Layout toggle
  const cycleLayout = useCallback(() => {
    const next = LAYOUT_CYCLE[layout];
    setLayout(next);
    setLayoutForFeed('home', next);
  }, [layout]);

  const LayoutIcon = layout === 'card' ? LayoutGrid : layout === 'compact' ? AlignJustify : LayoutList;

  // Scroll-to-top on tab re-press
  const listRef = useRef<FlashList<PostData>>(null);
  useScrollToTop(useRef({ scrollToOffset: (opts: { offset: number; animated: boolean }) => listRef.current?.scrollToOffset(opts) }));

  // Hide-on-scroll tab bar
  const lastOffsetRef = useRef(0);
  const setTabBarVisible = useUIStore.getState().setTabBarVisible;
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastOffsetRef.current;
    if (delta > 50 && y > 100) { setTabBarVisible(false); lastOffsetRef.current = y; }
    else if (delta < -20) { setTabBarVisible(true); lastOffsetRef.current = y; }
  }, [setTabBarVisible]);

  const allPosts = data?.pages.flatMap((p) =>
    p.data.children.filter((c) => c.kind === 't3').map((c) => c.data as PostData)
  ) ?? [];

  const posts = hideReadPosts ? allPosts.filter((p) => !readIds.has(p.id)) : allPosts;

  const handleVote = useCallback(
    (id: string, dir: 1 | 0 | -1) => {
      const post = allPosts.find((p) => p.id === id);
      if (post) vote({ id, direction: dir, post });
    },
    [vote, allPosts]
  );

  const handleSave = useCallback(
    (id: string, doSave: boolean) => {
      const post = allPosts.find((p) => p.id === id);
      if (post) save({ id, save: doSave, post });
    },
    [save, allPosts]
  );

  // Select the right component based on layout
  const PostComponent = layout === 'compact' ? PostCardCompact
                       : layout === 'list' ? PostCardList
                       : PostCard;

  return (
    <View style={styles.container}>
      {/* Sort pills + layout toggle */}
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
        <Pressable style={styles.layoutBtn} onPress={cycleLayout} hitSlop={8}>
          <LayoutIcon size={18} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <FeedSkeleton layout={layout} />
      ) : (
        <FlashList
          ref={listRef}
          data={posts}
          keyExtractor={(item) => item.id}
          estimatedItemSize={ESTIMATED_SIZE[layout]}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <PostComponent
              post={item}
              onVote={handleVote}
              onSave={handleSave}
              isRead={dimReadPosts && readIds.has(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={accentColor} />
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={accentColor} style={{ margin: 20 }} /> : null
          }
          ItemSeparatorComponent={layout === 'card' ? () => <View style={styles.separator} /> : undefined}
        />
      )}
    </View>
  );
}
