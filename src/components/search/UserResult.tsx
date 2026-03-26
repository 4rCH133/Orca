import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { formatScore } from '@/utils/format';
import { useThemedStyles } from '@/theme/useTheme';
import type { RedditUser } from '@/api/reddit';

interface Props {
  user: RedditUser;
}

export function UserResult({ user }: Props) {
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
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.colors.bg.elevated },
    avatarFallback: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: t.colors.bg.elevated,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    avatarLetter: { color: t.colors.text.primary, fontWeight: '700' as const, fontSize: 14 },
    info: { flex: 1, gap: 2 },
    name: { ...t.typography.label, color: t.colors.text.primary },
    meta: { ...t.typography.caption, color: t.colors.text.muted },
  }));

  const avatar = user.icon_img?.replace(/\?.*/, '');
  const accountAge = Math.floor((Date.now() / 1000 - user.created_utc) / (365.25 * 86400));

  return (
    <View style={s.container}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={s.avatar} contentFit="cover" />
      ) : (
        <View style={s.avatarFallback}>
          <Text style={s.avatarLetter}>{user.name[0].toUpperCase()}</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name}>u/{user.name}</Text>
        <Text style={s.meta}>{formatScore(user.total_karma)} karma · {accountAge}y</Text>
      </View>
    </View>
  );
}
