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
      <Pressable onPress={handleUpvote} hitSlop={10} style={({ pressed }) => pressed && styles.pressed}>
        <Text style={[styles.arrow, likes === true && styles.upvoted]}>▲</Text>
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
      <Pressable onPress={handleDownvote} hitSlop={10} style={({ pressed }) => pressed && styles.pressed}>
        <Text style={[styles.arrow, likes === false && styles.downvoted]}>▼</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg.elevated,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  containerVertical: { flexDirection: 'column', gap: 4 },
  pressed: { opacity: 0.6 },
  arrow: { color: colors.text.muted, fontSize: 12, fontWeight: '700' },
  upvoted: { color: colors.accent.primary },
  downvoted: { color: colors.accent.blue },
  score: { ...typography.score, color: colors.text.primary, minWidth: 28, textAlign: 'center' },
  upvotedScore: { color: colors.accent.primary },
  downvotedScore: { color: colors.accent.blue },
});
