import { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Text, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { searchReddit, PostData } from '@/api/reddit';
import { PostCard } from '@/components/feed/PostCard';
import { useThemedStyles } from '@/theme/useTheme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const router = useRouter();

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
    empty: { ...t.typography.body, color: t.colors.text.muted, textAlign: 'center' as const, marginTop: 40 },
    hint: { ...t.typography.body, color: t.colors.text.muted, textAlign: 'center' as const, marginTop: 60, paddingHorizontal: 32 },
    accent: t.colors.accent.ocean,
    muted: t.colors.text.muted,
  }));

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
    <View style={s.container}>
      <View style={s.searchRow}>
        <View style={s.inputWrap}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            style={s.input}
            placeholder="Search Reddit..."
            placeholderTextColor={s.muted as string}
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

      {isLoading ? (
        <ActivityIndicator color={s.accent as string} style={{ marginTop: 40 }} />
      ) : results.length === 0 && submitted ? (
        <Text style={s.empty}>No results for "{submitted}"</Text>
      ) : submitted === '' ? (
        <Text style={s.hint}>Search for posts, subreddits, and communities</Text>
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
