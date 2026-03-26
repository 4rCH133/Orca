/**
 * Post detail screen — post content + virtualized comment tree + reply composer.
 * Route: /post/{id}
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, Share as RNShare } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { MessageCircle, Send, Share2 } from 'lucide-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { usePost } from '@/api/queries/post';
import { useVotePost, useSavePost } from '@/api/queries/feed';
import { useSubmitComment } from '@/api/queries/comments';
import { CommentList } from '@/components/comments/CommentList';
import { CommentComposer } from '@/components/comments/CommentComposer';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { PostDetailSkeleton } from '@/components/ui/PostDetailSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { markAsRead } from '@/db/readPosts';
import { formatScore, formatTimeAgo } from '@/utils/format';
import { useTheme, useThemedStyles } from '@/theme/useTheme';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = usePost(id);
  const { mutate: vote } = useVotePost();
  const { mutate: save } = useSavePost();
  const { theme } = useTheme();

  // Composer state
  const composerRef = useRef<BottomSheet>(null);
  const [replyTarget, setReplyTarget] = useState<{ id: string; fullname: string; body?: string } | null>(null);
  const submitComment = useSubmitComment(id);

  // Mark post as read when viewing
  useEffect(() => {
    if (id) markAsRead(id);
  }, [id]);

  const openComposer = useCallback((parentCommentId: string, parentBody?: string) => {
    const isPost = parentCommentId === id;
    const fullname = isPost ? `t3_${id}` : `t1_${parentCommentId}`;
    setReplyTarget({
      id: parentCommentId,
      fullname,
      body: isPost ? undefined : parentBody, // show quoted comment (not post title)
    });
  }, [id]);

  const handleSubmitReply = useCallback((body: string) => {
    if (!replyTarget) return;
    submitComment.mutate(
      { parentFullname: replyTarget.fullname, body },
      {
        onSuccess: () => {
          composerRef.current?.close();
          setReplyTarget(null);
        },
      },
    );
  }, [replyTarget, submitComment]);

  const handleDismissComposer = useCallback(() => {
    composerRef.current?.close();
    setReplyTarget(null);
  }, []);

  const s = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base },
    header: { padding: 14, gap: 4 },
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
    voteRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 20, marginTop: 8, marginBottom: 14 },
    commentsRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 },
    commentsCount: { color: t.colors.text.secondary, fontSize: 14 },
    divider: { height: 1, backgroundColor: t.colors.bg.subtle, marginBottom: 4 },
    fab: {
      position: 'absolute' as const,
      bottom: 24,
      right: 20,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: t.colors.accent.ocean,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      ...t.elevation.md,
    },
  }));

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (isError || !data) {
    return <ErrorState message="Failed to load post." onRetry={() => refetch()} />;
  }

  const { post, comments } = data;
  const imageUrl = post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');

  const postHeader = (
    <View>
      <View style={s.header}>
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
            <MessageCircle size={14} color={theme.colors.text.secondary} />
            <Text style={s.commentsCount}>{formatScore(post.num_comments)} comments</Text>
          </View>
          <Pressable
            onPress={() => RNShare.share({ url: `https://reddit.com${post.permalink}`, message: post.title })}
            hitSlop={8}
          >
            <Share2 size={18} color={theme.colors.text.secondary} />
          </Pressable>
        </View>
      </View>
      <View style={s.divider} />
    </View>
  );

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: `r/${post.subreddit}`, headerBackTitle: 'Back' }} />

      <CommentList
        comments={comments}
        postId={post.id}
        onReply={openComposer}
        ListHeaderComponent={postHeader}
        isRefetching={false}
        onRefresh={() => refetch()}
      />

      {/* Reply FAB — opens composer to reply to the post */}
      <Pressable style={s.fab} onPress={() => openComposer(post.id)}>
        <Send size={22} color="#FFFFFF" />
      </Pressable>

      {/* Comment Composer bottom sheet */}
      {replyTarget && (
        <CommentComposer
          bottomSheetRef={composerRef}
          parentId={replyTarget.id}
          parentFullname={replyTarget.fullname}
          parentBody={replyTarget.body}
          onSubmit={handleSubmitReply}
          onDismiss={handleDismissComposer}
          isSubmitting={submitComment.isPending}
        />
      )}
    </View>
  );
}
