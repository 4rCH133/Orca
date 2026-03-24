import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { PostData } from '@/api/reddit';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { formatScore, formatTimeAgo } from '@/utils/format';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface Props {
  post: PostData;
  onVote?: (id: string, dir: 1 | 0 | -1) => void;
  onSave?: (id: string, save: boolean) => void;
}

export function PostCard({ post, onVote, onSave }: Props) {
  const router = useRouter();
  const thumbnail =
    post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ??
    (post.thumbnail !== 'self' &&
    post.thumbnail !== 'default' &&
    post.thumbnail !== 'nsfw' &&
    post.thumbnail?.startsWith('http')
      ? post.thumbnail
      : null);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/post/${post.id}`)}
      android_ripple={{ color: colors.bg.elevated }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/r/${post.subreddit}`);
          }}
          hitSlop={4}
        >
          <Text style={styles.subreddit}>r/{post.subreddit}</Text>
        </Pressable>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatTimeAgo(post.created_utc)}
        </Text>
      </View>

      {/* Main row: text + thumbnail side-by-side */}
      <View style={styles.mainRow}>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={3}>
            {post.title}
          </Text>
          {post.link_flair_text ? (
            <View style={styles.flairBadge}>
              <Text style={styles.flairText} numberOfLines={1}>
                {post.link_flair_text}
              </Text>
            </View>
          ) : null}
        </View>

        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.thumbSmall}
            contentFit="cover"
            transition={150}
          />
        ) : null}
      </View>

      {/* Full-width image for image posts */}
      {!thumbnail && post.post_hint === 'image' && post.url ? (
        <Image
          source={{ uri: post.url }}
          style={styles.thumbFull}
          contentFit="cover"
          transition={200}
        />
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <VoteButtons
          score={post.score}
          likes={post.likes}
          onUpvote={() => onVote?.(post.id, post.likes === true ? 0 : 1)}
          onDownvote={() => onVote?.(post.id, post.likes === false ? 0 : -1)}
        />
        <View style={styles.footerRight}>
          <Text style={styles.commentsText}>💬 {formatScore(post.num_comments)}</Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onSave?.(post.id, !post.saved);
            }}
            hitSlop={8}
            style={styles.saveBtn}
          >
            <Text style={[styles.saveIcon, post.saved && styles.saveIconActive]}>
              {post.saved ? '◆' : '◇'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  cardPressed: { backgroundColor: colors.bg.elevated },
  header: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
  subreddit: { ...typography.label, color: colors.text.primary },
  dot: { color: colors.text.muted, fontSize: 10 },
  meta: { ...typography.caption, color: colors.text.muted, flex: 1 },
  mainRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  textBlock: { flex: 1, gap: 6 },
  title: { ...typography.title, color: colors.text.primary },
  flairBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.subtle,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  flairText: { ...typography.caption, color: colors.text.muted },
  thumbSmall: {
    width: 90,
    height: 72,
    borderRadius: 6,
    backgroundColor: colors.bg.elevated,
  },
  thumbFull: {
    width: '100%',
    height: 240,
    borderRadius: 8,
    backgroundColor: colors.bg.elevated,
    marginBottom: 10,
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  commentsText: { ...typography.caption, color: colors.text.muted },
  saveBtn: {},
  saveIcon: { color: colors.text.muted, fontSize: 15 },
  saveIconActive: { color: colors.accent.primary },
});
