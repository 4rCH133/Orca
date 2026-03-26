/**
 * CommentRow — single flat comment row for FlashList rendering.
 * Handles: normal comments, "Load more", "Continue thread", AutoModerator.
 */

import { View, Text, Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { MessageSquare } from 'lucide-react-native';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { formatScore, formatTimeAgo } from '@/utils/format';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { FlatComment } from '@/utils/commentTree';

const INDENT = 12;

interface CommentRowProps {
  item: FlatComment;
  onToggleCollapse: (id: string) => void;
  onVote: (id: string, dir: 1 | 0 | -1) => void;
  onReply: (id: string, body?: string) => void;
  onLoadMore?: (ids: string[], parentId: string) => void;
}

export function CommentRow({ item, onToggleCollapse, onVote, onReply, onLoadMore }: CommentRowProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const s = useThemedStyles((t) => ({
    container: { paddingRight: 14, paddingVertical: 8 },
    threadLineContainer: { position: 'absolute' as const, top: 0, bottom: 0, left: 0 },
    threadLine: { position: 'absolute' as const, top: 0, bottom: 0, width: 2 },
    content: { gap: 4 },
    authorRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
    author: { color: t.colors.text.primary, fontWeight: '700' as const, fontSize: 13 },
    authorOP: { color: t.colors.accent.green },
    authorBot: { color: t.colors.text.muted, fontStyle: 'italic' as const },
    badge: {
      paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4,
      backgroundColor: t.colors.accent.green + '20',
    },
    badgeText: { color: t.colors.accent.green, fontSize: 10, fontWeight: '700' as const },
    botBadge: { backgroundColor: t.colors.text.muted + '20' },
    botBadgeText: { color: t.colors.text.muted, fontSize: 10, fontWeight: '600' as const },
    time: { color: t.colors.text.secondary, fontSize: 12 },
    edited: { color: t.colors.text.muted, fontSize: 11, fontStyle: 'italic' as const },
    collapsedHint: { color: t.colors.text.muted, fontSize: 12 },
    actionsRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginTop: 4 },
    replyBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, padding: 4 },
    replyText: { color: t.colors.text.muted, fontSize: 12 },
    moreText: { color: t.colors.accent.ocean, fontSize: 13, fontWeight: '600' as const, paddingVertical: 8 },
    continueText: { color: t.colors.accent.ocean, fontSize: 13, paddingVertical: 8 },
  }));

  const { comment, depth, isCollapsed, isMoreChildren, isContinueThread, moreChildrenIds, moreCount, childCount } = item;

  // "Load more" placeholder
  if (isMoreChildren) {
    return (
      <View style={[s.container, { paddingLeft: 14 + depth * INDENT }]}>
        <Pressable onPress={() => onLoadMore?.(moreChildrenIds ?? [], comment.id)}>
          <Text style={s.moreText}>
            Load {moreCount || 'more'} more {(moreCount ?? 0) === 1 ? 'reply' : 'replies'}
          </Text>
        </Pressable>
      </View>
    );
  }

  // "Continue thread" placeholder
  if (isContinueThread) {
    return (
      <View style={[s.container, { paddingLeft: 14 + depth * INDENT }]}>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(`https://reddit.com${item.comment.permalink || ''}`)}>
          <Text style={s.continueText}>Continue this thread →</Text>
        </Pressable>
      </View>
    );
  }

  const isBot = comment.author === 'AutoModerator';
  const isOP = comment.is_submitter;

  return (
    <View style={[s.container, { paddingLeft: 14 + depth * INDENT }]}>
      {/* Thread depth lines */}
      <View style={s.threadLineContainer}>
        {Array.from({ length: depth }).map((_, d) => (
          <View
            key={d}
            style={[
              s.threadLine,
              {
                left: 14 + d * INDENT,
                backgroundColor: c.depth[d % c.depth.length] + '40',
              },
            ]}
          />
        ))}
      </View>

      <View style={s.content}>
        {/* Author row — tap to collapse */}
        <Pressable onPress={() => onToggleCollapse(comment.id)} style={s.authorRow}>
          {isOP && (
            <View style={s.badge}>
              <Text style={s.badgeText}>OP</Text>
            </View>
          )}
          {isBot && (
            <View style={[s.badge, s.botBadge]}>
              <Text style={s.botBadgeText}>Bot</Text>
            </View>
          )}
          <Text style={[s.author, isOP && s.authorOP, isBot && s.authorBot]}>
            u/{comment.author}
          </Text>
          <Text style={s.time}>{formatTimeAgo(comment.created_utc)}</Text>
          {comment.edited && comment.edited !== false && (
            <Text style={s.edited}>edited</Text>
          )}
          {isCollapsed && (
            <Text style={s.collapsedHint}>[{childCount} {childCount === 1 ? 'reply' : 'replies'}]</Text>
          )}
        </Pressable>

        {/* Body + actions (hidden when collapsed) */}
        {!isCollapsed && (
          <>
            {comment.body ? <MarkdownRenderer content={comment.body} /> : null}

            <View style={s.actionsRow}>
              <VoteButtons
                compact
                score={comment.score}
                likes={comment.likes}
                onUpvote={() => onVote(comment.id, comment.likes === true ? 0 : 1)}
                onDownvote={() => onVote(comment.id, comment.likes === false ? 0 : -1)}
              />
              <Pressable style={s.replyBtn} onPress={() => onReply(comment.id, comment.body)}>
                <MessageSquare size={14} color={c.text.muted} />
                <Text style={s.replyText}>Reply</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
