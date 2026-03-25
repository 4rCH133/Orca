/**
 * Skeleton — animated shimmer placeholder for loading states.
 * Uses Reanimated for smooth 60fps opacity pulse.
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width, height, borderRadius = 4, style }: SkeletonProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true, // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.bg.subtle,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Row of skeleton bars — convenience for common patterns */
export function SkeletonRow({ children, gap = 8 }: { children: React.ReactNode; gap?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      {children}
    </View>
  );
}
