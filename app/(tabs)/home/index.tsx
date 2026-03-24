import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useHomeFeed } from '@/api/queries/feed';
import type { FeedSort, PostData } from '@/api/reddit';

const SORT_OPTIONS: FeedSort[] = ['best', 'hot', 'new', 'top', 'rising'];

export default function HomeScreen() {
  const [sort, setSort] = useState<FeedSort>('best');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useHomeFeed(sort);

  const posts = data?.pages.flatMap((p) =>
    p.data.children.map((c) => c.data as PostData)
  ) ?? [];

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator color="#FF4500" style={{ marginTop: 40 }} />
      ) : (
        <FlashList
          data={posts}
          keyExtractor={(item) => item.id}
          estimatedItemSize={120}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => <PostCard post={item} />}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#FF4500" /> : null}
        />
      )}
    </View>
  );
}

function PostCard({ post }: { post: PostData }) {
  return (
    <View style={styles.card}>
      <Text style={styles.subreddit}>r/{post.subreddit}</Text>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.meta}>↑ {post.score}  💬 {post.num_comments}  u/{post.author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1B' },
  card: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#343536', backgroundColor: '#1A1A1B' },
  subreddit: { color: '#818384', fontSize: 12, marginBottom: 4 },
  title: { color: '#D7DADC', fontSize: 16, fontWeight: '500', lineHeight: 22 },
  meta: { color: '#818384', fontSize: 12, marginTop: 8 },
});
