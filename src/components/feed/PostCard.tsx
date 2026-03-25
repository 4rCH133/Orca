import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { PostData } from '@/api/reddit';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { formatScore, formatTimeAgo } from '@/utils/format';
import { useTheme } from '@/theme/useTheme';
import { useThemedStyles } from '@/theme/useTheme';

interface Props {
  post: PostData;
  onVote?: (id: string, dir: 1 | 0 | -1) => void;
  onSave?: (id: string, save: boolean) => void;
  isRead?: boolean;
}

export function PostCard({ post, onVote, onSave, isRead }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const s = useThemedStyles((t) => ({
    card: {
      backgroundColor: t.colors.bg.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border.default,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,
    },
    cardPressed: { backgroundColor: t.colors.bg.elevated },
    cardRead: { opacity: 0.6 },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, marginBottom: 7 },
    subreddit: { ...t.typography.label, color: t.colors.accent.ocean },
    dot: { color: t.colors.text.muted, fontSize: 10 },
    meta: { ...t.typography.caption, color: t.colors.text.muted, flex: 1 },
    mainRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 10 },
    textBlock: { flex: 1, gap: 6 },
    title: { ...t.typography.title, color: t.colors.text.primary },
    flairBadge: {
      alignSelf: 'flex-start' as const,
      backgroundColor: t.colors.bg.subtle,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    flairText: { ...t.typography.caption, color: t.colors.text.muted },
    thumbSmall: { width: 90, height: 72, borderRadius: 6, backgroundColor: t.colors.bg.elevated },
    thumbFull: { width: '100%' as any, height: 240, borderRadius: 8, backgroundColor: t.colors.bg.elevated, marginBottom: 10 },
    footer: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    footerRight: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14 },
    commentsText: { ...t.typography.caption, color: t.colors.text.muted, marginLeft: 4 },
    saveIcon: { color: t.colors.text.muted, fontSize: 15 },
    saveIconActive: { color: t.colors.accent.save },
  }));

  const thumbnail =
    post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ??
    (post.thumbnail !== 'self' && post.thumbnail !== 'default' && post.thumbnail !== 'nsfw' && post.thumbnail?.startsWith('http')
      ? post.thumbnail
      : null);

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed, isRead && s.cardRead]}
      onPress={() => router.push(`/post/${post.id}`)}
      android_ripple={{ color: c.bg.elevated }}
    >
      <View style={s.header}>
        <Pressable onPress={(e) => { e.stopPropagation(); router.push(`/r/${post.subreddit}`); }} hitSlop={4}>
          <Text style={s.subreddit}>r/{post.subreddit}</Text>
        </Pressable>
        <Text style={s.dot}>·</Text>
        <Text style={s.meta} numberOfLines={1}>{formatTimeAgo(post.created_utc)}</Text>
      </View>

      <View style={s.mainRow}>
        <View style={s.textBlock}>
          <Text style={s.title} numberOfLines={3}>{post.title}</Text>
          {post.link_flair_text ? (
            <View style={s.flairBadge}>
              <Text style={s.flairText} numberOfLines={1}>{post.link_flair_text}</Text>
            </View>
          ) : null}
        </View>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={s.thumbSmall} contentFit="cover" transition={150} />
        ) : null}
      </View>

      {!thumbnail && post.post_hint === 'image' && post.url ? (
        <Image source={{ uri: post.url }} style={s.thumbFull} contentFit="cover" transition={200} />
      ) : null}

      <View style={s.footer}>
        <VoteButtons
          score={post.score}
          likes={post.likes}
          onUpvote={() => onVote?.(post.id, post.likes === true ? 0 : 1)}
          onDownvote={() => onVote?.(post.id, post.likes === false ? 0 : -1)}
        />
        <View style={s.footerRight}>
          <MessageCircle size={13} color={c.text.muted} />
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
