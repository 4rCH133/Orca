import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { MessageCircle } from 'lucide-react-native';
import { usePost } from '@/api/queries/post';
import { useVotePost, useSavePost } from '@/api/queries/feed';
import { CommentThread } from '@/components/comments/CommentThread';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { PostDetailSkeleton } from '@/components/ui/PostDetailSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { markAsRead } from '@/db/readPosts';
import { formatScore, formatTimeAgo } from '@/utils/format';
import { useThemedStyles } from '@/theme/useTheme';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = usePost(id);
  const { mutate: vote } = useVotePost();
  const { mutate: save } = useSavePost();

  // Mark post as read when viewing
  useEffect(() => {
    if (id) markAsRead(id);
  }, [id]);

  const s = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base },
    content: { padding: 14 },
    center: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: t.colors.bg.base },
    errorText: { color: t.colors.text.secondary },
    subreddit: { color: t.colors.accent.ocean, fontWeight: '700' as const, fontSize: 13, marginBottom: 2 },
    meta: { color: t.colors.text.secondary, fontSize: 12, marginBottom: 10 },
    title: { color: t.colors.text.primary, fontSize: 18, fontWeight: '700' as const, lineHeight: 26, marginBottom: 10 },
    flairBadge: {
      alignSelf: 'flex-start' as const,
      backgroundColor: t.colors.bg.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.colors.border.default,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 10,
    },
    flairText: { color: t.colors.text.secondary, fontSize: 11 },
    image: { width: '100%' as any, height: 300, borderRadius: 8, marginBottom: 12, backgroundColor: t.colors.bg.elevated },
    body: { color: t.colors.text.primary, fontSize: 15, lineHeight: 24, marginBottom: 14 },
    voteRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 20, marginBottom: 14 },
    commentsRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 },
    commentsCount: { color: t.colors.text.secondary, fontSize: 14 },
    divider: { height: 1, backgroundColor: t.colors.bg.subtle, marginBottom: 4 },
    noComments: { color: t.colors.text.secondary, textAlign: 'center' as const, marginTop: 24 },
    accentColor: t.colors.accent.ocean,
    secondaryColor: t.colors.text.secondary,
  }));

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (isError || !data) {
    return <ErrorState message="Failed to load post." onRetry={() => refetch()} />;
  }

  const { post, comments } = data;
  const imageUrl = post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');

  return (
    <>
      <Stack.Screen options={{ title: `r/${post.subreddit}`, headerBackTitle: 'Back' }} />
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.subreddit}>r/{post.subreddit}</Text>
        <Text style={s.meta}>u/{post.author} · {formatTimeAgo(post.created_utc)}</Text>
        <Text style={s.title}>{post.title}</Text>

        {post.link_flair_text ? (
          <View style={s.flairBadge}>
            <Text style={s.flairText}>{post.link_flair_text}</Text>
          </View>
        ) : null}

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={s.image} contentFit="contain" transition={200} />
        ) : null}

        {post.selftext ? (
          <MarkdownRenderer content={post.selftext} />
        ) : null}

        <View style={s.voteRow}>
          <VoteButtons
            score={post.score}
            likes={post.likes}
            onUpvote={() => vote({ id: post.id, direction: post.likes === true ? 0 : 1, post })}
            onDownvote={() => vote({ id: post.id, direction: post.likes === false ? 0 : -1, post })}
          />
          <View style={s.commentsRow}>
            <MessageCircle size={14} color={s.secondaryColor as string} />
            <Text style={s.commentsCount}>{formatScore(post.num_comments)} comments</Text>
          </View>
        </View>

        <View style={s.divider} />

        {comments.length === 0 ? (
          <Text style={s.noComments}>No comments yet.</Text>
        ) : (
          comments.map((c) => <CommentThread key={c.id} comment={c} depth={0} />)
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}
