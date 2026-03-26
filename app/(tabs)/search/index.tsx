import { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Text, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchReddit, PostData, RedditListing } from '@/api/reddit';
import { useVotePost, useSavePost } from '@/api/queries/feed';
import { PostCard } from '@/components/feed/PostCard';
import { FeedSkeleton } from '@/components/ui/FeedSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { MOCK_MODE, mockPosts } from '@/dev';

function mockSearchListing(): RedditListing {
  return {
    data: { after: null, before: null, children: mockPosts.map((p) => ({ kind: 't3', data: p })) },
  };
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const { mutate: vote } = useVotePost();
  const { mutate: save } = useSavePost();
  const { theme } = useTheme();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['search', submitted],
    queryFn: MOCK_MODE
      ? () => Promise.resolve(mockSearchListing())
      : ({ pageParam }) => searchReddit(submitted, pageParam as string | undefined),
    getNextPageParam: (last: RedditListing) => last.data.after ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: submitted.length > 1,
    staleTime: 1000 * 60,
  });

  const results = data?.pages.flatMap((p) =>
    p.data.children.filter((c) => c.kind === 't3').map((c) => c.data as PostData)
  ) ?? [];

  const handleVote = useCallback(
    (id: string, dir: 1 | 0 | -1) => {
      const post = results.find((p) => p.id === id);
      if (post) vote({ id, direction: dir, post });
    },
    [vote, results],
  );

  const handleSave = useCallback(
    (id: string, doSave: boolean) => {
      const post = results.find((p) => p.id === id);
      if (post) save({ id, save: doSave, post });
    },
    [save, results],
  );

  const s = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base },
    searchRow: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border.default },
    inputWrap: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: t.colors.bg.elevated,
      borderRadius: 12,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchIcon: { color: t.colors.text.muted, fontSize: 16 },
    input: { flex: 1, ...t.typography.body, color: t.colors.text.primary, paddingVertical: 10 },
    clearBtn: { color: t.colors.text.muted, fontSize: 14 },
    hint: { ...t.typography.body, color: t.colors.text.muted, textAlign: 'center' as const, marginTop: 60, paddingHorizontal: 32 },
  }));

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
            onSubmitEditing={() => setSubmitted(query)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); setSubmitted(''); }} hitSlop={8}>
              <Text style={s.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {submitted === '' ? (
        <Text style={s.hint}>Search for posts, subreddits, and communities</Text>
      ) : isLoading ? (
        <FeedSkeleton layout="card" count={3} />
      ) : results.length === 0 ? (
        <EmptyState icon="⌕" title="No results" subtitle={`Nothing found for "${submitted}"`} />
      ) : (
        <FlashList
          data={results}
          keyExtractor={(item) => item.id}
          estimatedItemSize={150}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <PostCard post={item} onVote={handleVote} onSave={handleSave} />
          )}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={theme.colors.accent.ocean} style={{ margin: 20 }} /> : null
          }
        />
      )}
    </View>
  );
}
