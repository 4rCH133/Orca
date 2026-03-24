import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🐋 Orca</Text>
      <Text style={styles.tagline}>A better way to browse Reddit</Text>
      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={login}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Signing in...' : 'Sign in with Reddit'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1B',
    gap: 16,
    padding: 24,
  },
  logo: { fontSize: 64 },
  tagline: { fontSize: 18, color: '#D7DADC', textAlign: 'center' },
  button: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
