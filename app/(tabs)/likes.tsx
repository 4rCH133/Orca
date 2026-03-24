/**
 * Liked & Saved posts screen with LOCAL full-text search.
 * No API call needed — searches the SQLite FTS5 index.
 */
import { useState, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { searchLikedPosts, searchSavedPosts, LocalPost } from '@/db/likes';

type Tab = 'liked' | 'saved';

export default function LikesScreen() {
  const [tab, setTab] = useState<Tab>('liked');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocalPost[]>([]);

  const runSearch = useCallback(async (q: string, t: Tab) => {
    const posts = t === 'liked' ? await searchLikedPosts(q) : await searchSavedPosts(q);
    setResults(posts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      runSearch(query, tab);
    }, [query, tab])
  );

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabs}>
        {(['liked', 'saved'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'liked' ? 'Upvoted' : 'Saved'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search box */}
      <TextInput
        style={styles.search}
        placeholder={`Search ${tab} posts...`}
        placeholderTextColor="#818384"
        value={query}
        onChangeText={(q) => { setQuery(q); runSearch(q, tab); }}
        clearButtonMode="while-editing"
      />

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostRow post={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No posts found.</Text>}
      />
    </View>
  );
}

function PostRow({ post }: { post: LocalPost }) {
  return (
    <View style={styles.row}>
      <Text style={styles.subreddit}>r/{post.subreddit}</Text>
      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
      <Text style={styles.meta}>↑ {post.score}  💬 {post.num_comments}  u/{post.author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1B' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#343536' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FF4500' },
  tabText: { color: '#818384', fontWeight: '600' },
  tabTextActive: { color: '#FF4500' },
  search: {
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#272729',
    borderRadius: 8,
    color: '#D7DADC',
    fontSize: 15,
  },
  row: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#343536' },
  subreddit: { color: '#818384', fontSize: 12, marginBottom: 4 },
  title: { color: '#D7DADC', fontSize: 15, lineHeight: 20 },
  meta: { color: '#818384', fontSize: 12, marginTop: 6 },
  empty: { color: '#818384', textAlign: 'center', marginTop: 40 },
});
