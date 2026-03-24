import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { usePost } from '@/api/queries/post';
import { CommentThread } from '@/components/comments/CommentThread';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { formatScore, formatTimeAgo } from '@/utils/format';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = usePost(id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF4500" size="large" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load post.</Text>
      </View>
    );
  }

  const { post, comments } = data;
  const imageUrl = post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');

  return (
    <>
      <Stack.Screen options={{ title: `r/${post.subreddit}`, headerBackTitle: 'Back' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Subreddit + meta */}
        <Text style={styles.subreddit}>r/{post.subreddit}</Text>
        <Text style={styles.meta}>u/{post.author} · {formatTimeAgo(post.created_utc)}</Text>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Flair */}
        {post.link_flair_text ? (
          <View style={styles.flairBadge}>
            <Text style={styles.flairText}>{post.link_flair_text}</Text>
          </View>
        ) : null}

        {/* Image */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
            transition={200}
          />
        ) : null}

        {/* Self text */}
        {post.selftext ? (
          <Text style={styles.body} selectable>{post.selftext}</Text>
        ) : null}

        {/* Vote row */}
        <View style={styles.voteRow}>
          <VoteButtons score={post.score} likes={post.likes} onUpvote={() => {}} onDownvote={() => {}} />
          <Text style={styles.commentsCount}>💬 {formatScore(post.num_comments)} comments</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Comments */}
        {comments.length === 0 ? (
          <Text style={styles.noComments}>No comments yet.</Text>
        ) : (
          comments.map((c) => <CommentThread key={c.id} comment={c} depth={0} />)
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0B' },
  content: { padding: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0B' },
  errorText: { color: '#818384' },
  subreddit: { color: '#FF4500', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  meta: { color: '#818384', fontSize: 12, marginBottom: 10 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 26, marginBottom: 10 },
  flairBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#343536',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  flairText: { color: '#818384', fontSize: 11 },
  image: { width: '100%', height: 300, borderRadius: 8, marginBottom: 12, backgroundColor: '#111' },
  body: { color: '#D7DADC', fontSize: 15, lineHeight: 24, marginBottom: 14 },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 14 },
  commentsCount: { color: '#818384', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#1E1E1F', marginBottom: 4 },
  noComments: { color: '#818384', textAlign: 'center', marginTop: 24 },
});
