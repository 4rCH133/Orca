import { View, Text, Pressable } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useThemedStyles } from '@/theme/useTheme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  const s = useThemedStyles((t) => ({
    container: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 16, padding: 32 },
    message: { ...t.typography.body, color: t.colors.text.secondary, textAlign: 'center' as const },
    button: {
      backgroundColor: t.colors.accent.ocean,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 10,
    },
    buttonText: { ...t.typography.label, color: '#FFFFFF' },
    errorColor: t.colors.semantic.error,
  }));

  return (
    <View style={s.container}>
      <AlertCircle size={48} color={s.errorColor as string} />
      <Text style={s.message}>{message}</Text>
      {onRetry && (
        <Pressable style={s.button} onPress={onRetry}>
          <Text style={s.buttonText}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}
