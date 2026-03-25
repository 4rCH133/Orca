import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { formatScore } from '@/utils/format';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface Props {
  score: number;
  likes: boolean | null;
  onUpvote: () => void;
  onDownvote: () => void;
  vertical?: boolean;
}

export function VoteButtons({ score, likes, onUpvote, onDownvote, vertical }: Props) {
  const handleUpvote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpvote();
  };
  const handleDownvote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDownvote();
  };

  return (
    <View style={[styles.container, vertical && styles.containerVertical]}>
      <Pressable
        onPress={handleUpvote}
        hitSlop={10}
        style={[styles.voteBtn, likes === true && styles.upvotedBtn]}
      >
        <Text style={[styles.voteBtnText, likes === true && styles.upvotedText]}>+</Text>
      </Pressable>

      <Text
        style={[
          styles.score,
          likes === true && styles.upvotedScore,
          likes === false && styles.downvotedScore,
        ]}
      >
        {formatScore(score)}
      </Text>

      <Pressable
        onPress={handleDownvote}
        hitSlop={10}
        style={[styles.voteBtn, likes === false && styles.downvotedBtn]}
      >
        <Text style={[styles.voteBtnText, likes === false && styles.downvotedText]}>−</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg.elevated,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  containerVertical: { flexDirection: 'column', gap: 4 },
  voteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upvotedBtn: { backgroundColor: colors.accent.orangeDim },
  downvotedBtn: { backgroundColor: '#5B8AF020' },
  voteBtnText: { color: colors.text.muted, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  upvotedText: { color: colors.accent.orange },
  downvotedText: { color: colors.accent.downvote },
  score: { ...typography.score, color: colors.text.primary, minWidth: 28, textAlign: 'center' },
  upvotedScore: { color: colors.accent.orange },
  downvotedScore: { color: colors.accent.downvote },
});
