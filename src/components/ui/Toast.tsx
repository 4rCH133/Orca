/**
 * Toast — auto-dismissing feedback banner.
 * Slides down from top, stays 3s, slides back up.
 * Renders as an overlay — doesn't block touches on underlying content.
 */

import { useEffect, useRef } from 'react';
import { Text, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/store/toastStore';
import { useThemedStyles } from '@/theme/useTheme';

export function Toast() {
  const { message, type, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;

  const s = useThemedStyles((t) => ({
    container: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      paddingTop: insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    banner: {
      backgroundColor: type === 'error' ? t.colors.semantic.error : t.colors.accent.ocean,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...t.elevation.md,
    },
    text: {
      ...t.typography.label,
      color: '#FFFFFF',
      textAlign: 'center' as const,
    },
  }));

  useEffect(() => {
    if (message) {
      // Slide down
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 3s
      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }).start(() => hide());
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[s.container, { transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      <Pressable style={s.banner} onPress={() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }).start(() => hide());
      }}>
        <Text style={s.text}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}
