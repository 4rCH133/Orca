import { View, Text } from 'react-native';
import { useThemedStyles } from '@/theme/useTheme';

export default function InboxScreen() {
  const s = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 8 },
    icon: { fontSize: 40, color: t.colors.text.muted, marginBottom: 4 },
    label: { ...t.typography.titleLarge, color: t.colors.text.primary },
    sub: { ...t.typography.body, color: t.colors.text.muted },
  }));

  return (
    <View style={s.container}>
      <Text style={s.icon}>✉</Text>
      <Text style={s.label}>Inbox</Text>
      <Text style={s.sub}>Coming in Phase 4</Text>
    </View>
  );
}
