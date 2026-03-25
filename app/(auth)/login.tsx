import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useThemedStyles } from '@/theme/useTheme';

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();

  const s = useThemedStyles((t) => ({
    container: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: t.colors.bg.base,
      paddingHorizontal: 32,
      gap: 16,
    },
    logoWrap: {
      width: 96,
      height: 96,
      borderRadius: 24,
      backgroundColor: t.colors.bg.surface,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border.strong,
      marginBottom: 8,
    },
    logoGlyph: { fontSize: 48, color: t.colors.text.primary },
    appName: { fontSize: 36, fontWeight: '800' as const, color: t.colors.text.primary, letterSpacing: -1 },
    tagline: { ...t.typography.body, color: t.colors.text.muted, textAlign: 'center' as const },
    divider: { width: 32, height: 1, backgroundColor: t.colors.border.strong, marginVertical: 8 },
    button: {
      backgroundColor: t.colors.accent.ocean,
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 14,
      width: '100%' as any,
      alignItems: 'center' as const,
      marginTop: 8,
    },
    buttonPressed: { opacity: 0.85 },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { ...t.typography.label, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.2 },
    legal: { ...t.typography.caption, color: t.colors.text.muted, textAlign: 'center' as const, lineHeight: 18, marginTop: 8 },
  }));

  return (
    <View style={s.container}>
      <View style={s.logoWrap}>
        <Text style={s.logoGlyph}>◈</Text>
      </View>

      <Text style={s.appName}>Orca</Text>
      <Text style={s.tagline}>Reddit, the way it should feel.</Text>

      <View style={s.divider} />

      <Pressable
        style={({ pressed }) => [s.button, pressed && s.buttonPressed, isLoading && s.buttonDisabled]}
        onPress={login}
        disabled={isLoading}
      >
        <Text style={s.buttonText}>
          {isLoading ? 'Connecting…' : 'Continue with Reddit'}
        </Text>
      </Pressable>

      <Text style={s.legal}>
        By continuing you agree to Reddit's Terms of Service.{'\n'}
        Orca is an independent third-party client.
      </Text>
    </View>
  );
}
