import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export default function InboxScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✉</Text>
      <Text style={styles.label}>Inbox</Text>
      <Text style={styles.sub}>Coming in Phase 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base, justifyContent: 'center', alignItems: 'center', gap: 8 },
  icon: { fontSize: 40, color: colors.text.muted, marginBottom: 4 },
  label: { ...typography.titleLarge, color: colors.text.primary },
  sub: { ...typography.body, color: colors.text.muted },
});
