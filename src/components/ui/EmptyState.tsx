import { View, Text } from 'react-native';
import { useThemedStyles } from '@/theme/useTheme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const s = useThemedStyles((t) => ({
    container: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 8, padding: 32 },
    icon: { fontSize: 48, color: t.colors.text.muted, marginBottom: 4 },
    title: { ...t.typography.title, color: t.colors.text.primary, textAlign: 'center' as const },
    subtitle: { ...t.typography.body, color: t.colors.text.muted, textAlign: 'center' as const },
  }));

  return (
    <View style={s.container}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
    </View>
  );
}
