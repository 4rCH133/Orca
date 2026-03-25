/**
 * PostDetailSkeleton — loading placeholder for the post detail screen.
 * Shows title, body, and comment shaped skeletons.
 */

import { View, ScrollView } from 'react-native';
import { Skeleton, SkeletonRow } from './Skeleton';
import { useThemedStyles } from '@/theme/useTheme';

function CommentSkeleton() {
  return (
    <View style={{ paddingTop: 12, gap: 6 }}>
      <SkeletonRow>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={80} height={12} />
        <Skeleton width={30} height={12} />
      </SkeletonRow>
      <Skeleton width="100%" height={12} />
      <Skeleton width="90%" height={12} />
    </View>
  );
}

export function PostDetailSkeleton() {
  const s = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bg.base },
    content: { padding: 14, gap: 10 },
    divider: { height: 1, backgroundColor: t.colors.bg.subtle, marginVertical: 8 },
  }));

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Subreddit + meta */}
      <Skeleton width={100} height={12} />
      <Skeleton width={160} height={10} />

      {/* Title */}
      <Skeleton width="100%" height={20} />
      <Skeleton width="85%" height={20} />

      {/* Image placeholder */}
      <Skeleton width="100%" height={240} borderRadius={8} />

      {/* Body text */}
      <Skeleton width="100%" height={14} />
      <Skeleton width="95%" height={14} />
      <Skeleton width="80%" height={14} />

      {/* Vote row */}
      <SkeletonRow>
        <Skeleton width={80} height={28} borderRadius={14} />
        <Skeleton width={80} height={14} />
      </SkeletonRow>

      {/* Divider */}
      <View style={s.divider} />

      {/* Comment skeletons */}
      <CommentSkeleton />
      <CommentSkeleton />
      <CommentSkeleton />
    </ScrollView>
  );
}
