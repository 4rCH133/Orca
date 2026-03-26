import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { formatScore } from '@/utils/format';
import { useThemedStyles } from '@/theme/useTheme';

interface Props {
  score: number;
  likes: boolean | null;
  onUpvote: () => void;
  onDownvote: () => void;
  vertical?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export function VoteButtons({ score, likes, onUpvote, onDownvote, vertical, compact, disabled }: Props) {
  const s = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: compact ? 4 : 6,
      backgroundColor: t.colors.bg.elevated,
      borderRadius: compact ? 14 : 20,
      paddingHorizontal: compact ? 4 : 8,
      paddingVertical: compact ? 2 : 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border.default,
    },
    containerVertical: { flexDirection: 'column' as const, gap: 4 },
    voteBtn: {
      width: compact ? 20 : 24,
      height: compact ? 20 : 24,
      borderRadius: compact ? 10 : 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    upvotedBtn: { backgroundColor: t.colors.accent.orangeDim },
    downvotedBtn: { backgroundColor: '#5B8AF020' },
    voteBtnText: {
      color: t.colors.text.muted,
      fontSize: compact ? 12 : 14,
      fontWeight: '700' as const,
      lineHeight: compact ? 14 : 18,
    },
    upvotedText: { color: t.colors.accent.orange },
    downvotedText: { color: t.colors.accent.downvote },
    score: {
      ...t.typography.score,
      color: t.colors.text.primary,
      minWidth: compact ? 20 : 28,
      textAlign: 'center' as const,
      fontSize: compact ? 11 : 13,
    },
    upvotedScore: { color: t.colors.accent.orange },
    downvotedScore: { color: t.colors.accent.downvote },
  }));

  const handleUpvote = () => { if (disabled) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpvote(); };
  const handleDownvote = () => { if (disabled) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDownvote(); };

  return (
    <View style={[s.container, vertical && s.containerVertical, disabled && { opacity: 0.4 }]}>
      <Pressable
        onPress={handleUpvote}
        hitSlop={10}
        style={[s.voteBtn, likes === true && s.upvotedBtn]}
        accessibilityLabel={`Upvote, ${likes === true ? 'currently upvoted' : 'not voted'}, ${formatScore(score)} points`}
        accessibilityRole="button"
      >
        <Text style={[s.voteBtnText, likes === true && s.upvotedText]}>+</Text>
      </Pressable>
      <Text
        style={[s.score, likes === true && s.upvotedScore, likes === false && s.downvotedScore]}
        accessibilityLabel={`${formatScore(score)} points`}
      >
        {formatScore(score)}
      </Text>
      <Pressable
        onPress={handleDownvote}
        hitSlop={10}
        style={[s.voteBtn, likes === false && s.downvotedBtn]}
        accessibilityLabel={`Downvote, ${likes === false ? 'currently downvoted' : 'not voted'}, ${formatScore(score)} points`}
        accessibilityRole="button"
      >
        <Text style={[s.voteBtnText, likes === false && s.downvotedText]}>−</Text>
      </Pressable>
    </View>
  );
}
