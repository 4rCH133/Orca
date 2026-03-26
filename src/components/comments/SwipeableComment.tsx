/**
 * SwipeableComment — wraps CommentRow with horizontal swipe gestures.
 * Short swipe (30%) and long swipe (60%) trigger configurable actions.
 * Uses react-native-gesture-handler PanGesture + react-native-reanimated.
 */

import { useCallback, useMemo, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowUp, ArrowDown, MessageSquare, Bookmark, MinusCircle } from 'lucide-react-native';
import { CommentRow } from './CommentRow';
import { useGestureStore, type GestureAction } from '@/store/gestureStore';
import { useTheme } from '@/theme/useTheme';
import type { FlatComment } from '@/utils/commentTree';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHORT_THRESHOLD = SCREEN_WIDTH * 0.3;
const LONG_THRESHOLD = SCREEN_WIDTH * 0.6;

interface SwipeableCommentProps {
  item: FlatComment;
  onToggleCollapse: (id: string) => void;
  onVote: (id: string, dir: 1 | 0 | -1) => void;
  onReply: (id: string, body?: string) => void;
  onSave?: (id: string) => void;
  onLoadMore?: (ids: string[], parentId: string) => void;
}

const ACTION_COLORS: Record<string, string> = {
  upvote: '#FF4500',
  downvote: '#5B8AF0',
  reply: '#3B9FD4',
  save: '#F0C040',
  collapse: '#484F58',
  none: 'transparent',
};

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function SwipeableComment({
  item,
  onToggleCollapse,
  onVote,
  onReply,
  onSave,
  onLoadMore,
}: SwipeableCommentProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const hasTriggeredShort = useSharedValue(false);
  const hasTriggeredLong = useSharedValue(false);

  const shortRight = useGestureStore((s) => s.commentShortRight);
  const longRight = useGestureStore((s) => s.commentLongRight);
  const shortLeft = useGestureStore((s) => s.commentShortLeft);
  const longLeft = useGestureStore((s) => s.commentLongLeft);

  const executeAction = useCallback((action: GestureAction) => {
    const id = item.comment.id;
    switch (action) {
      case 'upvote': onVote(id, item.comment.likes === true ? 0 : 1); break;
      case 'downvote': onVote(id, item.comment.likes === false ? 0 : -1); break;
      case 'reply': onReply(id, item.comment.body); break;
      case 'collapse': onToggleCollapse(id); break;
      case 'save': onSave?.(id); break;
    }
  }, [item, onVote, onReply, onToggleCollapse, onSave]);

  // Use ref for executeAction so the gesture object stays stable across renders
  const executeActionRef = useRef(executeAction);
  executeActionRef.current = executeAction;

  const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-5, 5]) // Activate on small horizontal movement
    .onUpdate((e) => {
      translateX.value = e.translationX;

      const abs = Math.abs(e.translationX);
      if (abs > LONG_THRESHOLD && !hasTriggeredLong.value) {
        hasTriggeredLong.value = true;
        runOnJS(triggerHaptic)();
      } else if (abs > SHORT_THRESHOLD && !hasTriggeredShort.value) {
        hasTriggeredShort.value = true;
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd((e) => {
      const abs = Math.abs(e.translationX);
      const isRight = e.translationX > 0;

      if (abs > LONG_THRESHOLD) {
        const action = isRight ? longRight : longLeft;
        if (action !== 'none') runOnJS(executeActionRef.current)(action);
      } else if (abs > SHORT_THRESHOLD) {
        const action = isRight ? shortRight : shortLeft;
        if (action !== 'none') runOnJS(executeActionRef.current)(action);
      }

      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      hasTriggeredShort.value = false;
      hasTriggeredLong.value = false;
    }), [shortRight, longRight, shortLeft, longLeft]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bgAnimatedStyle = useAnimatedStyle(() => {
    const isRight = translateX.value > 0;
    const abs = Math.abs(translateX.value);
    let color = 'transparent';

    if (abs > LONG_THRESHOLD) {
      color = ACTION_COLORS[isRight ? longRight : longLeft] ?? 'transparent';
    } else if (abs > SHORT_THRESHOLD) {
      color = ACTION_COLORS[isRight ? shortRight : shortLeft] ?? 'transparent';
    }

    return { backgroundColor: color + '30' }; // 30% opacity
  });

  // Don't wrap "more" or "continue" placeholders
  if (item.isMoreChildren || item.isContinueThread) {
    return (
      <CommentRow
        item={item}
        onToggleCollapse={onToggleCollapse}
        onVote={onVote}
        onReply={onReply}
        onLoadMore={onLoadMore}
      />
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View>
        <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }, bgAnimatedStyle]} />
        <Animated.View style={animatedStyle}>
          <CommentRow
            item={item}
            onToggleCollapse={onToggleCollapse}
            onVote={onVote}
            onReply={onReply}
            onLoadMore={onLoadMore}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
