import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CommentData } from '@/api/reddit';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { formatScore, formatTimeAgo } from '@/utils/format';

const INDENT = 12;
const INDENT_COLORS = ['#FF4500', '#7193FF', '#46D160', '#FFD635', '#FF585B', '#818384'];

interface Props {
  comment: CommentData;
  depth?: number;
}

export function CommentThread({ comment, depth = 0 }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const replies =
    comment.replies && typeof comment.replies !== 'string'
      ? comment.replies.data.children
          .filter((c) => c.kind === 't1')
          .map((c) => c.data as CommentData)
      : [];

  const indentColor = INDENT_COLORS[depth % INDENT_COLORS.length];

  return (
    <View style={[styles.container, depth > 0 && { marginLeft: INDENT, borderLeftWidth: 2, borderLeftColor: indentColor + '40', paddingLeft: 8 }]}>
      {/* Author row */}
      <Pressable onPress={() => setCollapsed((v) => !v)} style={styles.authorRow}>
        <Text style={[styles.author, comment.is_submitter && styles.authorOP]}>
          {comment.is_submitter ? '[OP] ' : ''}u/{comment.author}
        </Text>
        <Text style={styles.time}>{formatTimeAgo(comment.created_utc)}</Text>
        {collapsed && <Text style={styles.collapsedHint}>  [{replies.length} replies]</Text>}
      </Pressable>

      {!collapsed && (
        <>
          {/* Body */}
          <Text style={styles.body} selectable>
            {comment.body}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <VoteButtons
              score={comment.score}
              likes={comment.likes}
              onUpvote={() => {}}
              onDownvote={() => {}}
            />
          </View>

          {/* Nested replies */}
          {replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  author: { color: '#D7DADC', fontWeight: '700', fontSize: 13 },
  authorOP: { color: '#46D160' },
  time: { color: '#818384', fontSize: 12 },
  collapsedHint: { color: '#818384', fontSize: 12 },
  body: { color: '#D7DADC', fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', marginTop: 6 },
});
