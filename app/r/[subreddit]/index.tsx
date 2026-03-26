/**
 * Subreddit screen — banner, info, subscribe, rules, flair filter, post feed.
 * Route: /r/{subreddit}
 */

import { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { ChevronDown, ChevronUp, LayoutGrid, AlignJustify, LayoutList } from 'lucide-react-native';
import { useSubredditInfo } from '@/api/queries/post';
import { useSubredditFeed, useVotePost, useSavePost } from '@/api/queries/feed';
import { useSubredditRules, useSubscribe, useSubredditFlairs, useSubredditFlairFeed } from '@/api/queries/subreddit';
import { PostCard } from '@/components/feed/PostCard';
import { PostCardCompact } from '@/components/feed/PostCardCompact';
import { PostCardList } from '@/components/feed/PostCardList';
import { FeedSkeleton } from '@/components/ui/FeedSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { FeedSort, PostData } from '@/api/reddit';
import { formatScore } from '@/utils/format';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { getLayoutForFeed, setLayoutForFeed } from '@/store/settingsStore';

type FeedLayout = 'card' | 'compact' | 'list';
const SORTS: FeedSort[] = ['hot', 'new', 'top', 'rising'];
const LAYOUT_CYCLE: Record<FeedLayout, FeedLayout> = { card: 'compact', compact: 'list', list: 'card' };
const ESTIMATED_SIZE: Record<FeedLayout, number> = { card: 200, compact: 64, list: 100 };

export default function SubredditScreen() {
  const { subreddit } = useLocalSearchParams<{ subreddit: string }>();
  const [sort, setSort] = useState<FeedSort>('hot');
  const [layout, setLayout] = useState<FeedLayout>(() => getLayoutForFeed(subreddit));
  const [selectedFlair, setSelectedFlair] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const { theme } = useTheme();
  const { data: subInfo } = useSubredditInfo(subreddit);
  const { data: rulesData } = useSubredditRules(subreddit);
  const { data: flairsData } = useSubredditFlairs(subreddit);
  const { mutate: subscribe } = useSubscribe();
  const { mutate: vote } = useVotePost();
  const { mutate: save } = useSavePost();

  // Normal feed (no flair filter)
  const normalFeed = useSubredditFeed(subreddit, sort);
  // Flair-filtered feed (only when a flair is selected)
  const flairFeed = useSubredditFlairFeed(subreddit, selectedFlair ?? '', sort);
  const feed = selectedFlair ? flairFeed : normalFeed;

  const info = subInfo?.data;
  const rules = rulesData?.rules ?? [];
  const flairs = flairsData ?? [];

  const posts = feed.data?.pages.flatMap((p) =>
    p.data.children.filter((c) => c.kind === 't3').map((c) => c.data as PostData)
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

  const cycleLayout = () => {
    const next = LAYOUT_CYCLE[layout];
    setLayout(next);
    setLayoutForFeed(subreddit, next);
  };

  const PostComponent = layout === 'compact' ? PostCardCompact : layout === 'list' ? PostCardList : PostCard;
  const LayoutIcon = layout === 'card' ? LayoutGrid : layout === 'compact' ? AlignJustify : LayoutList;

  const s = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base },
    banner: { width: '100%' as any, height: 120, backgroundColor: t.colors.bg.elevated },
    headerSection: { padding: 14, gap: 8 },
    headerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
    icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: t.colors.bg.elevated, borderWidth: 2, borderColor: t.colors.bg.base },
    iconFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: t.colors.accent.ocean, justifyContent: 'center' as const, alignItems: 'center' as const },
    iconInitial: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' as const },
    headerInfo: { flex: 1 },
    subName: { ...t.typography.title, color: t.colors.text.primary },
    members: { ...t.typography.caption, color: t.colors.text.secondary },
    joinBtn: { backgroundColor: t.colors.accent.ocean, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
    joinedBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.border.strong, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
    joinText: { ...t.typography.label, color: '#FFFFFF' },
    joinedText: { ...t.typography.label, color: t.colors.text.muted },
    description: { ...t.typography.bodySmall, color: t.colors.text.secondary },
    showMore: { ...t.typography.caption, color: t.colors.accent.ocean, marginTop: 4 },
    rulesHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingVertical: 8 },
    rulesTitle: { ...t.typography.label, color: t.colors.text.primary },
    rule: { paddingVertical: 6, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: t.colors.border.default, marginBottom: 4 },
    ruleName: { ...t.typography.label, color: t.colors.text.primary },
    ruleDesc: { ...t.typography.caption, color: t.colors.text.muted, marginTop: 2 },
    divider: { height: 0.5, backgroundColor: t.colors.border.default },
    flairRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
    flairPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: t.colors.bg.elevated, borderWidth: 0.5, borderColor: t.colors.border.default },
    flairPillActive: { backgroundColor: t.colors.accent.ocean, borderColor: t.colors.accent.ocean },
    flairText: { ...t.typography.caption, color: t.colors.text.secondary },
    flairTextActive: { color: '#FFFFFF' },
    sortBar: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderBottomWidth: 0.5, borderBottomColor: t.colors.border.default },
    sortPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: t.colors.bg.elevated },
    sortPillActive: { backgroundColor: t.colors.accent.ocean },
    sortLabel: { ...t.typography.label, color: t.colors.text.secondary },
    sortLabelActive: { color: '#FFFFFF' },
    layoutBtn: { marginLeft: 'auto' as any, padding: 6 },
  }));

  if (!info && !feed.isLoading) {
    return <ErrorState message={`Could not load r/${subreddit}`} onRetry={() => feed.refetch()} />;
  }

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: `r/${subreddit}`, headerBackTitle: 'Back' }} />

      <FlashList
        data={posts}
        keyExtractor={(item) => item.id}
        estimatedItemSize={ESTIMATED_SIZE[layout]}
        onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <PostComponent post={item} onVote={handleVote} onSave={handleSave} />
        )}
        refreshControl={
          <RefreshControl refreshing={feed.isRefetching} onRefresh={feed.refetch} tintColor={theme.colors.accent.ocean} />
        }
        ListHeaderComponent={
          <View>
            {/* Banner */}
            {info?.banner_img ? (
              <Image source={{ uri: info.banner_img }} style={s.banner} contentFit="cover" />
            ) : (
              <View style={s.banner} />
            )}

            <View style={s.headerSection}>
              {/* Icon + name + subscribe */}
              <View style={s.headerRow}>
                {info?.icon_img ? (
                  <Image source={{ uri: info.icon_img }} style={s.icon} contentFit="cover" />
                ) : (
                  <View style={s.iconFallback}>
                    <Text style={s.iconInitial}>{subreddit[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={s.headerInfo}>
                  <Text style={s.subName}>r/{subreddit}</Text>
                  <Text style={s.members}>{info ? formatScore(info.subscribers) : '...'} members</Text>
                </View>
                <Pressable
                  style={info?.user_is_subscriber ? s.joinedBtn : s.joinBtn}
                  onPress={() => subscribe({ subreddit, action: info?.user_is_subscriber ? 'unsub' : 'sub' })}
                >
                  <Text style={info?.user_is_subscriber ? s.joinedText : s.joinText}>
                    {info?.user_is_subscriber ? 'Joined ✓' : 'Join'}
                  </Text>
                </Pressable>
              </View>

              {/* Description */}
              {info?.public_description ? (
                <Pressable onPress={() => setDescExpanded((v) => !v)}>
                  <Text style={s.description} numberOfLines={descExpanded ? undefined : 3}>
                    {info.public_description}
                  </Text>
                  {info.public_description.length > 150 && (
                    <Text style={s.showMore}>{descExpanded ? 'Show less' : 'Show more'}</Text>
                  )}
                </Pressable>
              ) : null}

              {/* Rules accordion */}
              {rules.length > 0 && (
                <>
                  <Pressable style={s.rulesHeader} onPress={() => setShowRules((v) => !v)}>
                    <Text style={s.rulesTitle}>Rules ({rules.length})</Text>
                    {showRules
                      ? <ChevronUp size={16} color={theme.colors.text.secondary} />
                      : <ChevronDown size={16} color={theme.colors.text.secondary} />}
                  </Pressable>
                  {showRules && rules.map((rule, i) => (
                    <View key={i} style={s.rule}>
                      <Text style={s.ruleName}>{i + 1}. {rule.short_name}</Text>
                      {rule.description ? <Text style={s.ruleDesc}>{rule.description}</Text> : null}
                    </View>
                  ))}
                </>
              )}
            </View>

            <View style={s.divider} />

            {/* Flair filter chips */}
            {flairs.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.flairRow}>
                <Pressable
                  style={[s.flairPill, !selectedFlair && s.flairPillActive]}
                  onPress={() => setSelectedFlair(null)}
                >
                  <Text style={[s.flairText, !selectedFlair && s.flairTextActive]}>All</Text>
                </Pressable>
                {flairs.map((f) => (
                  <Pressable
                    key={f.id}
                    style={[s.flairPill, selectedFlair === f.text && s.flairPillActive]}
                    onPress={() => setSelectedFlair(selectedFlair === f.text ? null : f.text)}
                  >
                    <Text style={[s.flairText, selectedFlair === f.text && s.flairTextActive]}>{f.text}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Sort pills + layout toggle */}
            <View style={s.sortBar}>
              {SORTS.map((s2) => (
                <Pressable
                  key={s2}
                  onPress={() => setSort(s2)}
                  style={[s.sortPill, sort === s2 && s.sortPillActive]}
                >
                  <Text style={[s.sortLabel, sort === s2 && s.sortLabelActive]}>
                    {s2.charAt(0).toUpperCase() + s2.slice(1)}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={s.layoutBtn} onPress={cycleLayout} hitSlop={8}>
                <LayoutIcon size={18} color={theme.colors.text.secondary} />
              </Pressable>
            </View>

            {feed.isLoading && <FeedSkeleton layout={layout} count={3} />}
          </View>
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? <ActivityIndicator color={theme.colors.accent.ocean} style={{ margin: 20 }} /> : null
        }
        ListEmptyComponent={
          !feed.isLoading ? <EmptyState icon="⌕" title="No posts" subtitle="This subreddit has no posts yet." /> : null
        }
      />
    </View>
  );
}
