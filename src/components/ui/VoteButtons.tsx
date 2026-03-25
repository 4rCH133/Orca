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
}

export function VoteButtons({ score, likes, onUpvote, onDownvote, vertical }: Props) {
  const s = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      backgroundColor: t.colors.bg.elevated,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border.default,
    },
    containerVertical: { flexDirection: 'column' as const, gap: 4 },
    voteBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
    upvotedBtn: { backgroundColor: t.colors.accent.orangeDim },
    downvotedBtn: { backgroundColor: '#5B8AF020' },
    voteBtnText: { color: t.colors.text.muted, fontSize: 14, fontWeight: '700' as const, lineHeight: 18 },
    upvotedText: { color: t.colors.accent.orange },
    downvotedText: { color: t.colors.accent.downvote },
    score: { ...t.typography.score, color: t.colors.text.primary, minWidth: 28, textAlign: 'center' as const },
    upvotedScore: { color: t.colors.accent.orange },
    downvotedScore: { color: t.colors.accent.downvote },
  }));

  const handleUpvote = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpvote(); };
  const handleDownvote = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDownvote(); };

  return (
    <View style={[s.container, vertical && s.containerVertical]}>
      <Pressable onPress={handleUpvote} hitSlop={10} style={[s.voteBtn, likes === true && s.upvotedBtn]}>
        <Text style={[s.voteBtnText, likes === true && s.upvotedText]}>+</Text>
      </Pressable>
      <Text style={[s.score, likes === true && s.upvotedScore, likes === false && s.downvotedScore]}>
        {formatScore(score)}
      </Text>
      <Pressable onPress={handleDownvote} hitSlop={10} style={[s.voteBtn, likes === false && s.downvotedBtn]}>
        <Text style={[s.voteBtnText, likes === false && s.downvotedText]}>−</Text>
      </Pressable>
    </View>
  );
}
