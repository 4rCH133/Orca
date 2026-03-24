/**
 * Orca Typography — clean, editorial, fast to read.
 * System fonts only — zero loading latency.
 */
import { Platform } from 'react-native';

const fontFamily = Platform.select({
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

export const typography = {
  // Post titles — high visual weight
  title: { fontSize: 17, fontWeight: '700' as const, lineHeight: 24, letterSpacing: -0.2 },
  titleLarge: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.3 },

  // Body text
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 23 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },

  // Labels, metadata
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.1 },
  caption: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.1 },

  // Score / numbers — tabular
  score: { fontSize: 13, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as any },
} as const;
