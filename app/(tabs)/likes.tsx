import { useState, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { searchLikedPosts, searchSavedPosts, searchDownvotedPosts, LocalPost } from '@/db/likes';
import { useTheme } from '@/theme/useTheme';
import { useThemedStyles } from '@/theme/useTheme';
import { formatScore, formatTimeAgo } from '@/utils/format';

type Tab = 'upvoted' | 'downvoted' | 'saved';

export default function LikesScreen() {
  const [tab, setTab] = useState<Tab>('liked');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocalPost[]>([]);
  const [loading, setLoading] = useState(false);

  const s = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base },
    tabRow: { flexDirection: 'row' as const, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border.default },
    tab: { flex: 1, paddingVertical: 13, alignItems: 'center' as const },
    tabActive: { borderBottomWidth: 2, borderBottomColor: t.colors.accent.ocean },
    tabText: { ...t.typography.label, color: t.colors.text.muted },
    tabTextActive: { color: t.colors.text.primary },
    searchWrap: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      margin: 12,
      backgroundColor: t.colors.bg.elevated,
      borderRadius: 12,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchIcon: { color: t.colors.text.muted, fontSize: 16 },
    input: { flex: 1, ...t.typography.body, color: t.colors.text.primary, paddingVertical: 10 },
    row: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border.default,
      gap: 5,
    },
    rowTop: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    rowSubreddit: { ...t.typography.label, color: t.colors.accent.ocean },
    rowFlair: { ...t.typography.caption, color: t.colors.text.muted },
    rowTitle: { ...t.typography.title, color: t.colors.text.primary, fontWeight: '500' as const },
    rowMeta: { ...t.typography.caption, color: t.colors.text.muted },
    emptyContainer: { flexGrow: 1, justifyContent: 'center' as const },
    emptyWrap: { alignItems: 'center' as const, gap: 8, paddingHorizontal: 32 },
    emptyIcon: { fontSize: 32, color: t.colors.text.muted, marginBottom: 4 },
    emptyTitle: { ...t.typography.title, color: t.colors.text.primary },
    emptySub: { ...t.typography.body, color: t.colors.text.muted, textAlign: 'center' as const },
    accent: t.colors.accent.ocean,
    muted: t.colors.text.muted,
  }));

  const runSearch = useCallback(async (q: string, t: Tab) => {
    setLoading(true);
    let posts: LocalPost[];
    if (t === 'upvoted') posts = await searchLikedPosts(q);
    else if (t === 'downvoted') posts = await searchDownvotedPosts(q);
    else posts = await searchSavedPosts(q);
    setResults(posts);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      runSearch(query, tab);
    }, [query, tab])
  );

  return (
    <View style={s.container}>
      <View style={s.tabRow}>
        {([
          { key: 'upvoted' as Tab, label: '+  Upvoted' },
          { key: 'downvoted' as Tab, label: '−  Downvoted' },
          { key: 'saved' as Tab, label: '◆  Saved' },
        ]).map(({ key, label }) => (
          <Pressable key={key} onPress={() => setTab(key)} style={[s.tab, tab === key && s.tabActive]}>
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          style={s.input}
          placeholder={`Search ${tab} posts…`}
          placeholderTextColor={s.muted as string}
          value={query}
          onChangeText={(q) => { setQuery(q); runSearch(q, tab); }}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={s.accent as string} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={s.row}>
              <View style={s.rowTop}>
                <Text style={s.rowSubreddit}>r/{item.subreddit}</Text>
                {item.flair ? <Text style={s.rowFlair}>{item.flair}</Text> : null}
              </View>
              <Text style={s.rowTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={s.rowMeta}>
                + {formatScore(item.score)}  ·  {formatScore(item.num_comments)} comments  ·  u/{item.author}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>{tab === 'upvoted' ? '+' : tab === 'downvoted' ? '−' : '◆'}</Text>
              <Text style={s.emptyTitle}>
                {query ? 'No matches found' : `No ${tab} posts yet`}
              </Text>
              <Text style={s.emptySub}>
                {query
                  ? 'Try a different search term'
                  : `${tab === 'upvoted' ? 'Upvote' : tab === 'downvoted' ? 'Downvote' : 'Save'} posts and they'll appear here — searchable offline`}
              </Text>
            </View>
          }
          contentContainerStyle={results.length === 0 ? s.emptyContainer : undefined}
        />
      )}
    </View>
  );
}
