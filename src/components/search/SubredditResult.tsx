import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { formatScore } from '@/utils/format';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { SubredditData } from '@/api/reddit';

interface Props {
  subreddit: SubredditData;
}

export function SubredditResult({ subreddit }: Props) {
  const router = useRouter();
  const { theme } = useTheme();

  const s = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 12,
      backgroundColor: t.colors.bg.surface,
      borderBottomWidth: 0.5,
      borderBottomColor: t.colors.border.default,
    },
    icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.colors.bg.elevated },
    iconFallback: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: t.colors.accent.ocean,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    iconLetter: { color: '#FFFFFF', fontWeight: '700' as const, fontSize: 14 },
    info: { flex: 1, gap: 2 },
    name: { ...t.typography.label, color: t.colors.accent.ocean },
    meta: { ...t.typography.caption, color: t.colors.text.muted },
    description: { ...t.typography.bodySmall, color: t.colors.text.secondary },
  }));

  return (
    <Pressable style={s.container} onPress={() => router.push(`/r/${subreddit.display_name}`)}>
      {subreddit.icon_img ? (
        <Image source={{ uri: subreddit.icon_img }} style={s.icon} contentFit="cover" />
      ) : (
        <View style={s.iconFallback}>
          <Text style={s.iconLetter}>{subreddit.display_name[0].toUpperCase()}</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name}>r/{subreddit.display_name}</Text>
        <Text style={s.meta}>{formatScore(subreddit.subscribers)} members</Text>
        {subreddit.public_description ? (
          <Text style={s.description} numberOfLines={1}>{subreddit.public_description}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
