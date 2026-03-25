/**
 * FeedSkeleton — 5 post-shaped placeholder rows matching the active layout mode.
 * Shown during initial feed load instead of a spinner.
 */

import { View } from 'react-native';
import { Skeleton, SkeletonRow } from './Skeleton';
import { useThemedStyles } from '@/theme/useTheme';

interface FeedSkeletonProps {
  layout?: 'card' | 'compact' | 'list';
  count?: number;
}

function CardSkeleton() {
  const s = useThemedStyles((t) => ({
    card: {
      padding: 14,
      gap: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: t.colors.border.default,
    },
  }));
  return (
    <View style={s.card}>
      <SkeletonRow>
        <Skeleton width={120} height={12} />
        <Skeleton width={6} height={6} borderRadius={3} />
        <Skeleton width={50} height={12} />
      </SkeletonRow>
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
      <Skeleton width="100%" height={180} borderRadius={8} />
      <SkeletonRow>
        <Skeleton width={80} height={28} borderRadius={14} />
        <Skeleton width={60} height={12} />
      </SkeletonRow>
    </View>
  );
}

function CompactSkeleton() {
  const s = useThemedStyles((t) => ({
    row: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: t.colors.border.default,
    },
  }));
  return (
    <View style={s.row}>
      <SkeletonRow>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width="70%" height={14} />
      </SkeletonRow>
      <SkeletonRow>
        <View style={{ width: 60 }} />
        <Skeleton width={80} height={10} />
        <Skeleton width={40} height={10} />
        <Skeleton width={60} height={10} />
      </SkeletonRow>
    </View>
  );
}

function ListSkeleton() {
  const s = useThemedStyles((t) => ({
    row: {
      flexDirection: 'row' as const,
      padding: 14,
      gap: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: t.colors.border.default,
    },
    right: { flex: 1, gap: 8 },
  }));
  return (
    <View style={s.row}>
      <Skeleton width={75} height={60} borderRadius={6} />
      <View style={s.right}>
        <Skeleton width="90%" height={14} />
        <Skeleton width="70%" height={14} />
        <SkeletonRow>
          <Skeleton width={60} height={10} />
          <Skeleton width={40} height={10} />
          <Skeleton width={50} height={10} />
        </SkeletonRow>
      </View>
    </View>
  );
}

export function FeedSkeleton({ layout = 'card', count = 5 }: FeedSkeletonProps) {
  const Item = layout === 'compact' ? CompactSkeleton
             : layout === 'list' ? ListSkeleton
             : CardSkeleton;

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </View>
  );
}
