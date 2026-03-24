import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { formatScore } from '@/utils/format';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const avatar = user.icon_img?.replace(/\?.*/, '');  // strip query params from Reddit avatar url

  return (
    <View style={styles.container}>
      {/* Avatar */}
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{user.name[0].toUpperCase()}</Text>
        </View>
      )}

      <Text style={styles.username}>u/{user.name}</Text>

      {/* Karma row */}
      <View style={styles.karmaRow}>
        <View style={styles.karmaStat}>
          <Text style={styles.karmaValue}>{formatScore(user.link_karma)}</Text>
          <Text style={styles.karmaLabel}>Post Karma</Text>
        </View>
        <View style={styles.karmaDivider} />
        <View style={styles.karmaStat}>
          <Text style={styles.karmaValue}>{formatScore(user.comment_karma)}</Text>
          <Text style={styles.karmaLabel}>Comment Karma</Text>
        </View>
      </View>

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bg.elevated,
    borderWidth: 2,
    borderColor: colors.border.strong,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bg.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { ...typography.titleLarge, color: colors.text.primary },
  username: { ...typography.titleLarge, color: colors.text.primary },
  karmaRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 32,
    marginTop: 8,
  },
  karmaStat: { alignItems: 'center', gap: 4 },
  karmaValue: { ...typography.titleLarge, color: colors.text.primary },
  karmaLabel: { ...typography.caption, color: colors.text.muted },
  karmaDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border.default },
  logoutBtn: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  logoutText: { ...typography.label, color: colors.text.secondary },
});
