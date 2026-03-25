import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CommentData } from '@/api/reddit';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { formatTimeAgo } from '@/utils/format';
import { useThemedStyles } from '@/theme/useTheme';

const INDENT = 12;

interface Props {
  comment: CommentData;
  depth?: number;
}

export function CommentThread({ comment, depth = 0 }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const s = useThemedStyles((t) => ({
    container: { paddingTop: 10 },
    authorRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 4 },
    author: { color: t.colors.text.primary, fontWeight: '700' as const, fontSize: 13 },
    authorOP: { color: t.colors.accent.green },
    time: { color: t.colors.text.secondary, fontSize: 12 },
    collapsedHint: { color: t.colors.text.muted, fontSize: 12 },
    body: { color: t.colors.text.primary, fontSize: 15, lineHeight: 22 },
    actions: { flexDirection: 'row' as const, marginTop: 6 },
    depthColors: t.colors.depth,
  }));

  const replies =
    comment.replies && typeof comment.replies !== 'string'
      ? comment.replies.data.children
          .filter((c) => c.kind === 't1')
          .map((c) => c.data as CommentData)
      : [];

  const indentColor = s.depthColors[depth % s.depthColors.length];

  return (
    <View style={[s.container, depth > 0 && { marginLeft: INDENT, borderLeftWidth: 2, borderLeftColor: indentColor + '40', paddingLeft: 8 }]}>
      <Pressable onPress={() => setCollapsed((v) => !v)} style={s.authorRow}>
        <Text style={[s.author, comment.is_submitter && s.authorOP]}>
          {comment.is_submitter ? '[OP] ' : ''}u/{comment.author}
        </Text>
        <Text style={s.time}>{formatTimeAgo(comment.created_utc)}</Text>
        {collapsed && <Text style={s.collapsedHint}>  [{replies.length} replies]</Text>}
      </Pressable>

      {!collapsed && (
        <>
          <Text style={s.body} selectable>{comment.body}</Text>
          <View style={s.actions}>
            <VoteButtons score={comment.score} likes={comment.likes} onUpvote={() => {}} onDownvote={() => {}} />
          </View>
          {replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </>
      )}
    </View>
  );
}
