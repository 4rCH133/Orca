/**
 * PostCardCompact — dense single-row post layout (~64dp).
 * No thumbnails, no images. Just vote + title + meta.
 * Used when feedLayout === 'compact'.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PostData } from '@/api/reddit';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { formatScore, formatTimeAgo } from '@/utils/format';
import { useThemedStyles } from '@/theme/useTheme';

interface Props {
  post: PostData;
  onVote?: (id: string, dir: 1 | 0 | -1) => void;
  onSave?: (id: string, save: boolean) => void;
  isRead?: boolean;
}

export function PostCardCompact({ post, onVote, onSave, isRead }: Props) {
  const router = useRouter();

  const s = useThemedStyles((t) => ({
    container: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: t.colors.bg.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border.default,
      gap: 4,
    },
    containerPressed: { backgroundColor: t.colors.bg.elevated },
    containerRead: { opacity: 0.6 },
    row1: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    title: { ...t.typography.body, color: t.colors.text.primary, flex: 1 },
    row2: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingLeft: 0 },
    subreddit: { ...t.typography.caption, color: t.colors.accent.ocean },
    dot: { color: t.colors.text.muted, fontSize: 8 },
    meta: { ...t.typography.caption, color: t.colors.text.muted },
  }));

  return (
    <Pressable
      style={({ pressed }) => [s.container, pressed && s.containerPressed, isRead && s.containerRead]}
      onPress={() => router.push(`/post/${post.id}`)}
    >
      <View style={s.row1}>
        <VoteButtons
          compact
          score={post.score}
          likes={post.likes}
          onUpvote={() => onVote?.(post.id, post.likes === true ? 0 : 1)}
          onDownvote={() => onVote?.(post.id, post.likes === false ? 0 : -1)}
        />
        <Text style={s.title} numberOfLines={1}>{post.title}</Text>
      </View>
      <View style={s.row2}>
        <Pressable onPress={(e) => { e.stopPropagation(); router.push(`/r/${post.subreddit}`); }} hitSlop={4}>
          <Text style={s.subreddit}>r/{post.subreddit}</Text>
        </Pressable>
        <Text style={s.dot}>·</Text>
        <Text style={s.meta}>{formatTimeAgo(post.created_utc)}</Text>
        <Text style={s.dot}>·</Text>
        <Text style={s.meta}>{formatScore(post.num_comments)} comments</Text>
      </View>
    </Pressable>
  );
}
