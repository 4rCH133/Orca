/**
 * Orca Typography — clean, editorial, fast to read.
 * System fonts only — zero loading latency.
 *
 * All sizes use `allowFontScaling: true` (React Native default) so text
 * respects OS Dynamic Type (iOS) and font size accessibility (Android).
 * Sizes are in sp (scale-independent pixels) which RN handles natively.
 */
import { Platform } from 'react-native';

export const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier New',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
    mono: 'monospace',
  },
  default: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'monospace',
  },
});

/**
 * Typography scale.
 *
 * React Native respects OS font scale automatically via `allowFontScaling`
 * (true by default on all Text components). These `fontSize` values are in
 * sp (scale-independent pixels) — they scale proportionally when the user
 * changes their OS accessibility font size.
 *
 * maxFontSizeMultiplier limits extreme scaling to prevent layout overflow.
 */
export const typography = {
  // Display — onboarding, splash
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.5 },

  // Headings — section headers
  heading: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.3 },

  // Post titles — high visual weight
  title: { fontSize: 17, fontWeight: '700' as const, lineHeight: 24, letterSpacing: -0.2 },
  titleLarge: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.3 },

  // Subtitles
  subtitle: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },

  // Body text
  bodyLarge: { fontSize: 17, fontWeight: '400' as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 23 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },

  // Labels, metadata
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.1 },
  caption: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.1 },

  // Score / numbers — tabular
  score: { fontSize: 13, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as any },
} as const;

/**
 * Recommended maxFontSizeMultiplier for different contexts.
 * Apply to Text components: <Text maxFontSizeMultiplier={fontScale.body}>
 */
export const fontScale = {
  display: 1.3,
  heading: 1.4,
  title: 1.5,
  body: 1.8,
  caption: 2.0,
} as const;
