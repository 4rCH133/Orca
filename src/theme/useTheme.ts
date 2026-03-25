import { useContext, useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { ThemeContext } from './ThemeProvider';
import type { ThemeTokens } from './tokens';

/**
 * Returns current theme tokens (colors, spacing, typography, borderRadius, elevation)
 * plus the active mode and setTheme function.
 */
export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Creates a memoized StyleSheet that updates when the theme changes.
 *
 * Usage:
 *   const styles = useThemedStyles((theme) => ({
 *     container: { backgroundColor: theme.colors.bg.base },
 *     title: { color: theme.colors.text.primary, ...theme.typography.title },
 *   }));
 */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (theme: ThemeTokens) => T,
): T {
  const { theme } = useContext(ThemeContext);
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
