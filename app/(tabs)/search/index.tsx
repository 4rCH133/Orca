import { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Text, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { searchReddit, PostData } from '@/api/reddit';
import { PostCard } from '@/components/feed/PostCard';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => searchReddit(submitted),
    enabled: submitted.length > 1,
    staleTime: 1000 * 60,
  });

  const results =
    data?.data.children
      .filter((c) => c.kind === 't3')
      .map((c) => c.data as PostData) ?? [];

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.input}
            placeholder="Search Reddit..."
            placeholderTextColor={colors.text.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setSubmitted(query)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); setSubmitted(''); }} hitSlop={8}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent.primary} style={{ marginTop: 40 }} />
      ) : results.length === 0 && submitted ? (
        <Text style={styles.empty}>No results for "{submitted}"</Text>
      ) : submitted === '' ? (
        <Text style={styles.hint}>Search for posts, subreddits, and communities</Text>
      ) : (
        <FlashList
          data={results}
          keyExtractor={(item) => item.id}
          estimatedItemSize={150}
          renderItem={({ item }) => <PostCard post={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  searchRow: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.default },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
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
  clearBtn: { color: colors.text.muted, fontSize: 14 },
  empty: { ...typography.body, color: colors.text.muted, textAlign: 'center', marginTop: 40 },
  hint: { ...typography.body, color: colors.text.muted, textAlign: 'center', marginTop: 60, paddingHorizontal: 32 },
});
