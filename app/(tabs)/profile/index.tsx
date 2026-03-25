import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';
import { useThemedStyles } from '@/theme/useTheme';
import { formatScore } from '@/utils/format';
import type { ThemeMode, ResolvedTheme } from '@/theme/tokens';

const THEME_OPTIONS: { mode: ThemeMode; label: string; description: string }[] = [
  { mode: 'system', label: 'System', description: 'Follow OS setting' },
  { mode: 'light', label: 'Light', description: '#FAFAFA' },
  { mode: 'darkGray', label: 'Dark Gray', description: '#121212' },
  { mode: 'darkMatte', label: 'Dark Matte', description: '#0D1117' },
  { mode: 'amoledBlack', label: 'AMOLED Black', description: '#000000' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { theme, mode, setTheme } = useTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.colors.bg.base,
      paddingTop: 60,
    },
    profileSection: {
      alignItems: 'center' as const,
      gap: 16,
      marginBottom: 32,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: t.colors.bg.elevated,
      borderWidth: 2,
      borderColor: t.colors.border.strong,
    },
    avatarPlaceholder: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: t.colors.bg.elevated,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    avatarInitial: { ...t.typography.titleLarge, color: t.colors.text.primary },
    username: { ...t.typography.titleLarge, color: t.colors.text.primary },
    karmaRow: {
      flexDirection: 'row' as const,
      backgroundColor: t.colors.bg.surface,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      gap: 32,
      marginTop: 8,
    },
    karmaStat: { alignItems: 'center' as const, gap: 4 },
    karmaValue: { ...t.typography.titleLarge, color: t.colors.text.primary },
    karmaLabel: { ...t.typography.caption, color: t.colors.text.muted },
    karmaDivider: { width: StyleSheet.hairlineWidth, backgroundColor: t.colors.border.default },
    sectionTitle: {
      ...t.typography.label,
      color: t.colors.text.secondary,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    themeRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: t.colors.bg.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border.default,
    },
    themeRowActive: {
      backgroundColor: t.colors.bg.elevated,
    },
    themeLabel: { ...t.typography.body, color: t.colors.text.primary },
    themeDesc: { ...t.typography.caption, color: t.colors.text.muted },
    themeCheck: { ...t.typography.body, color: t.colors.accent.ocean },
    logoutBtn: {
      marginTop: 24,
      marginHorizontal: 20,
      borderWidth: 1,
      borderColor: t.colors.border.strong,
      borderRadius: 12,
      paddingHorizontal: 32,
      paddingVertical: 12,
      alignItems: 'center' as const,
    },
    logoutText: { ...t.typography.label, color: t.colors.text.secondary },
  }));

  if (!user) return null;

  const avatar = user.icon_img?.replace(/\?.*/, '');

  return (
    <View style={styles.container}>
      {/* Profile info */}
      <View style={styles.profileSection}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{user.name[0].toUpperCase()}</Text>
          </View>
        )}

        <Text style={styles.username}>u/{user.name}</Text>

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
      </View>

      {/* Theme picker */}
      <Text style={styles.sectionTitle}>APPEARANCE</Text>
      {THEME_OPTIONS.map((opt) => (
        <Pressable
          key={opt.mode}
          style={[styles.themeRow, mode === opt.mode && styles.themeRowActive]}
          onPress={() => setTheme(opt.mode)}
        >
          <View>
            <Text style={styles.themeLabel}>{opt.label}</Text>
            <Text style={styles.themeDesc}>{opt.description}</Text>
          </View>
          {mode === opt.mode && <Text style={styles.themeCheck}>✓</Text>}
        </Pressable>
      ))}

      {/* Sign out */}
      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}
