/**
 * PostCardList — thumbnail-left balanced layout (~100dp).
 * Shows small thumbnail on left, title + meta on right.
 * Used when feedLayout === 'list'.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { PostData } from '@/api/reddit';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { formatScore, formatTimeAgo } from '@/utils/format';
import { useTheme, useThemedStyles } from '@/theme/useTheme';

interface Props {
  post: PostData;
  onVote?: (id: string, dir: 1 | 0 | -1) => void;
  onSave?: (id: string, save: boolean) => void;
  isRead?: boolean;
}

export function PostCardList({ post, onVote, onSave, isRead }: Props) {
  const router = useRouter();
  const { theme } = useTheme();

  const s = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row' as const,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 12,
      backgroundColor: t.colors.bg.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border.default,
    },
    containerPressed: { backgroundColor: t.colors.bg.elevated },
    containerRead: { opacity: 0.6 },
    thumb: {
      width: 75,
      height: 60,
      borderRadius: 6,
      backgroundColor: t.colors.bg.elevated,
    },
    thumbFallback: {
      width: 75,
      height: 60,
      borderRadius: 6,
      backgroundColor: t.colors.bg.elevated,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    thumbInitial: { fontSize: 18, fontWeight: '700' as const, color: t.colors.accent.ocean },
    right: { flex: 1, gap: 4 },
    title: { ...t.typography.title, color: t.colors.text.primary, fontSize: 15 },
    metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
    subreddit: { ...t.typography.caption, color: t.colors.accent.ocean },
    dot: { color: t.colors.text.muted, fontSize: 8 },
    meta: { ...t.typography.caption, color: t.colors.text.muted },
    footerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginTop: 2 },
    commentsText: { ...t.typography.caption, color: t.colors.text.muted, marginLeft: 3 },
    saveIcon: { color: t.colors.text.muted, fontSize: 13 },
    saveIconActive: { color: t.colors.accent.save },
  }));

  const thumbnail =
    post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ??
    (post.thumbnail !== 'self' && post.thumbnail !== 'default' && post.thumbnail !== 'nsfw' && post.thumbnail?.startsWith('http')
      ? post.thumbnail
      : null);

  return (
    <Pressable
      style={({ pressed }) => [s.container, pressed && s.containerPressed, isRead && s.containerRead]}
      onPress={() => router.push(`/post/${post.id}`)}
    >
      {/* Thumbnail or subreddit initial */}
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={s.thumb} contentFit="cover" transition={150} />
      ) : (
        <View style={s.thumbFallback}>
          <Text style={s.thumbInitial}>{post.subreddit[0].toUpperCase()}</Text>
        </View>
      )}

      {/* Right content */}
      <View style={s.right}>
        <Text style={s.title} numberOfLines={2}>{post.title}</Text>

        <View style={s.metaRow}>
          <Pressable onPress={(e) => { e.stopPropagation(); router.push(`/r/${post.subreddit}`); }} hitSlop={4}>
            <Text style={s.subreddit}>r/{post.subreddit}</Text>
          </Pressable>
          <Text style={s.dot}>·</Text>
          <Text style={s.meta}>u/{post.author}</Text>
          <Text style={s.dot}>·</Text>
          <Text style={s.meta}>{formatTimeAgo(post.created_utc)}</Text>
        </View>

        <View style={s.footerRow}>
          <VoteButtons
            compact
            score={post.score}
            likes={post.likes}
            onUpvote={() => onVote?.(post.id, post.likes === true ? 0 : 1)}
            onDownvote={() => onVote?.(post.id, post.likes === false ? 0 : -1)}
          />
          <MessageCircle size={12} color={theme.colors.text.muted} />
          <Text style={s.commentsText}>{formatScore(post.num_comments)}</Text>
          <Pressable onPress={(e) => { e.stopPropagation(); onSave?.(post.id, !post.saved); }} hitSlop={8}>
            <Text style={[s.saveIcon, post.saved && s.saveIconActive]}>
              {post.saved ? '◆' : '◇'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
