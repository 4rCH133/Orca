import { useState, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { searchLikedPosts, searchSavedPosts, LocalPost } from '@/db/likes';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { formatScore, formatTimeAgo } from '@/utils/format';

type Tab = 'liked' | 'saved';

export default function LikesScreen() {
  const [tab, setTab] = useState<Tab>('liked');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocalPost[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string, t: Tab) => {
    setLoading(true);
    const posts = t === 'liked' ? await searchLikedPosts(q) : await searchSavedPosts(q);
    setResults(posts);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      runSearch(query, tab);
    }, [query, tab])
  );

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(['liked', 'saved'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'liked' ? '▲  Upvoted' : '◆  Saved'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.input}
          placeholder={`Search ${tab === 'liked' ? 'upvoted' : 'saved'} posts…`}
          placeholderTextColor={colors.text.muted}
          value={query}
          onChangeText={(q) => { setQuery(q); runSearch(q, tab); }}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent.primary} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostRow post={item} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>{tab === 'liked' ? '▲' : '◆'}</Text>
              <Text style={styles.emptyTitle}>
                {query ? 'No matches found' : `No ${tab === 'liked' ? 'upvoted' : 'saved'} posts yet`}
              </Text>
              <Text style={styles.emptySub}>
                {query
                  ? 'Try a different search term'
                  : `${tab === 'liked' ? 'Upvote' : 'Save'} posts and they'll appear here`}
              </Text>
            </View>
          }
          contentContainerStyle={results.length === 0 && styles.emptyContainer}
        />
      )}
    </View>
  );
}

function PostRow({ post }: { post: LocalPost }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowSubreddit}>r/{post.subreddit}</Text>
        {post.flair ? <Text style={styles.rowFlair}>{post.flair}</Text> : null}
      </View>
      <Text style={styles.rowTitle} numberOfLines={2}>{post.title}</Text>
      <Text style={styles.rowMeta}>
        ▲ {formatScore(post.score)}  ·  💬 {formatScore(post.num_comments)}  ·  u/{post.author}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text.primary,
  },
  tabText: { ...typography.label, color: colors.text.muted },
  tabTextActive: { color: colors.text.primary },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: { color: colors.text.muted, fontSize: 16 },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: 10,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    gap: 5,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowSubreddit: { ...typography.label, color: colors.text.primary },
  rowFlair: { ...typography.caption, color: colors.text.muted },
  rowTitle: { ...typography.title, color: colors.text.primary, fontWeight: '500' },
  rowMeta: { ...typography.caption, color: colors.text.muted },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', gap: 8, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 32, color: colors.text.muted, marginBottom: 4 },
  emptyTitle: { ...typography.title, color: colors.text.primary },
  emptySub: { ...typography.body, color: colors.text.muted, textAlign: 'center' },
});
