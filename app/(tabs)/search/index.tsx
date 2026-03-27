/**
 * Enhanced Reddit Search — type tabs, date/sort filters, recent searches, trending.
 */

import { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Text, Pressable, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { X, Clock, TrendingUp } from 'lucide-react-native';
import { searchReddit, getPopularSubreddits, PostData, SubredditData, RedditUser, RedditListing, type TopTimeframe } from '@/api/reddit';
import { useVotePost, useSavePost } from '@/api/queries/feed';
import { PostCard } from '@/components/feed/PostCard';
import { SubredditResult } from '@/components/search/SubredditResult';
import { UserResult } from '@/components/search/UserResult';
import { FeedSkeleton } from '@/components/ui/FeedSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { addRecentSearch, getRecentSearches, removeRecentSearch } from '@/store/settingsStore';
import { MOCK_MODE, mockPosts, mockSubreddits } from '@/dev';

type SearchType = 'link' | 'sr' | 'user';
type SearchSort = 'relevance' | 'hot' | 'top' | 'new' | 'comments';

const TYPE_TABS: { key: SearchType; label: string; kind: string }[] = [
  { key: 'link', label: 'Posts', kind: 't3' },
  { key: 'sr', label: 'Subreddits', kind: 't5' },
  { key: 'user', label: 'Users', kind: 't2' },
];

const DATE_OPTIONS: { label: string; value: TopTimeframe }[] = [
  { label: 'All', value: 'all' },
  { label: 'Hour', value: 'hour' },
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const SORT_OPTIONS: { label: string; value: SearchSort }[] = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Hot', value: 'hot' },
  { label: 'Top', value: 'top' },
  { label: 'New', value: 'new' },
];

function mockSearchListing(): RedditListing {
  return { data: { after: null, before: null, children: mockPosts.map((p) => ({ kind: 't3', data: p })) } };
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('link');
  const [sort, setSort] = useState<SearchSort>('relevance');
  const [time, setTime] = useState<TopTimeframe>('all');
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearches());
  const { mutate: vote } = useVotePost();
  const { mutate: save } = useSavePost();
  const { theme } = useTheme();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['search', submitted, searchType, sort, time],
    queryFn: MOCK_MODE
      ? () => Promise.resolve(mockSearchListing())
      : ({ pageParam }) => searchReddit(submitted, pageParam as string | undefined, 25, searchType, sort, time),
    getNextPageParam: (last: RedditListing) => last.data.after ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: submitted.length > 1,
    staleTime: 1000 * 60,
  });

  const activeTab = TYPE_TABS.find((t) => t.key === searchType)!;
  const results = data?.pages.flatMap((p) =>
    p.data.children.filter((c) => c.kind === activeTab.kind).map((c) => c.data)
  ) ?? [];

  const handleSubmit = () => {
    if (!query.trim()) return;
    setSubmitted(query.trim());
    addRecentSearch(query.trim());
    setRecentSearches(getRecentSearches());
  };

  const handleVote = useCallback(
    (id: string, dir: 1 | 0 | -1) => {
      const post = results.find((p: any) => p.id === id) as PostData | undefined;
      if (post) vote({ id, direction: dir, post });
    },
    [vote, results],
  );

  const handleSave = useCallback(
    (id: string, doSave: boolean) => {
      const post = results.find((p: any) => p.id === id) as PostData | undefined;
      if (post) save({ id, save: doSave, post });
    },
    [save, results],
  );

  const s = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base },
    searchRow: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border.default },
    inputWrap: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      backgroundColor: t.colors.bg.elevated, borderRadius: 12, paddingHorizontal: 12, gap: 8,
    },
    searchIcon: { color: t.colors.text.muted, fontSize: 16 },
    input: { flex: 1, ...t.typography.body, color: t.colors.text.primary, paddingVertical: 10 },
    clearBtn: { padding: 4 },
    tabRow: {
      flexDirection: 'row' as const, borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border.default,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' as const },
    tabActive: { borderBottomWidth: 2, borderBottomColor: t.colors.accent.ocean },
    tabText: { ...t.typography.label, color: t.colors.text.muted },
    tabTextActive: { color: t.colors.accent.ocean },
    filterRow: {
      flexDirection: 'row' as const, paddingHorizontal: 12, paddingVertical: 6, gap: 6,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border.default,
    },
    pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: t.colors.bg.elevated },
    pillActive: { backgroundColor: t.colors.accent.ocean },
    pillText: { ...t.typography.caption, color: t.colors.text.secondary },
    pillTextActive: { color: '#FFFFFF' },
    recentSection: { padding: 16, gap: 8 },
    recentTitle: { ...t.typography.label, color: t.colors.text.secondary, marginBottom: 4 },
    recentRow: {
      flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
      paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border.default,
    },
    recentText: { ...t.typography.body, color: t.colors.text.primary, flex: 1 },
    recentDelete: { padding: 4 },
  }));

  // Empty state: show recent searches
  if (submitted === '') {
    return (
      <View style={s.container}>
        <View style={s.searchRow}>
          <View style={s.inputWrap}>
            <Text style={s.searchIcon}>⌕</Text>
            <TextInput
              style={s.input}
              placeholder="Search Reddit..."
              placeholderTextColor={theme.colors.text.muted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <ScrollView style={s.recentSection}>
          {recentSearches.length > 0 && (
            <>
              <Text style={s.recentTitle}>RECENT SEARCHES</Text>
              {recentSearches.map((term) => (
                <View key={term} style={s.recentRow}>
                  <Pressable style={{ flex: 1 }} onPress={() => { setQuery(term); setSubmitted(term); }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Clock size={14} color={theme.colors.text.muted} />
                      <Text style={s.recentText}>{term}</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={s.recentDelete}
                    onPress={() => { removeRecentSearch(term); setRecentSearches(getRecentSearches()); }}
                    hitSlop={8}
                  >
                    <X size={14} color={theme.colors.text.muted} />
                  </Pressable>
                </View>
              ))}
            </>
          )}

          <Text style={[s.recentTitle, { marginTop: 16 }]}>
            <TrendingUp size={14} color={theme.colors.text.secondary} /> TRENDING
          </Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.text.muted, marginTop: 8 }}>
            Search for posts, subreddits, and users
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Search bar */}
      <View style={s.searchRow}>
        <View style={s.inputWrap}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            style={s.input}
            placeholder="Search Reddit..."
            placeholderTextColor={theme.colors.text.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable style={s.clearBtn} onPress={() => { setQuery(''); setSubmitted(''); }} hitSlop={8}>
              <X size={16} color={theme.colors.text.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Type tabs */}
      <View style={s.tabRow}>
        {TYPE_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[s.tab, searchType === tab.key && s.tabActive]}
            onPress={() => setSearchType(tab.key)}
          >
            <Text style={[s.tabText, searchType === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Date + sort filter row (only for posts) */}
      {searchType === 'link' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {SORT_OPTIONS.map((o) => (
            <Pressable key={o.value} style={[s.pill, sort === o.value && s.pillActive]} onPress={() => setSort(o.value)}>
              <Text style={[s.pillText, sort === o.value && s.pillTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
          <View style={{ width: 8 }} />
          {DATE_OPTIONS.map((o) => (
            <Pressable key={o.value} style={[s.pill, time === o.value && s.pillActive]} onPress={() => setTime(o.value)}>
              <Text style={[s.pillText, time === o.value && s.pillTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      {isLoading ? (
        <FeedSkeleton layout="card" count={3} />
      ) : results.length === 0 ? (
        <EmptyState icon="⌕" title="No results" subtitle={`Nothing found for "${submitted}"`} />
      ) : (
        <FlashList
          data={results}
          keyExtractor={(item: any) => item.id ?? item.display_name ?? item.name}
          estimatedItemSize={searchType === 'link' ? 150 : 60}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item }: { item: any }) => {
            if (searchType === 'link') {
              return <PostCard post={item as PostData} onVote={handleVote} onSave={handleSave} />;
            }
            if (searchType === 'sr') {
              return <SubredditResult subreddit={item as SubredditData} />;
            }
            return <UserResult user={item as RedditUser} />;
          }}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={theme.colors.accent.ocean} style={{ margin: 20 }} /> : null
          }
        />
      )}
    </View>
  );
}
