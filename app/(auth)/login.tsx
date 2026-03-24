import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();

  return (
    <View style={styles.container}>
      {/* Logo mark */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoGlyph}>◈</Text>
      </View>

      <Text style={styles.appName}>Orca</Text>
      <Text style={styles.tagline}>Reddit, the way it should feel.</Text>

      {/* Divider */}
      <View style={styles.divider} />

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isLoading && styles.buttonDisabled]}
        onPress={login}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Connecting…' : 'Continue with Reddit'}
        </Text>
      </Pressable>

      <Text style={styles.legal}>
        By continuing you agree to Reddit's Terms of Service.{'\n'}
        Orca is an independent third-party client.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.base,
    paddingHorizontal: 32,
    gap: 16,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.bg.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
    marginBottom: 8,
  },
  logoGlyph: {
    fontSize: 48,
    color: colors.text.primary,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  tagline: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
  },
  divider: {
    width: 32,
    height: 1,
    backgroundColor: colors.border.strong,
    marginVertical: 8,
  },
  button: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    ...typography.label,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  legal: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
});
