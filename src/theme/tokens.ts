/**
 * Orca Theme Tokens — 4 theme modes per E1-S02.
 *
 * Light:       #FAFAFA bg — for daylight use
 * Dark Gray:   #121212 bg — easy on eyes, avoids halation + OLED smear
 * Dark Matte:  #0D1117 bg — Orca's signature deep-sea palette (default)
 * AMOLED Black:#000000 bg — true black for max OLED battery savings
 */

import { Platform, type ViewStyle, type TextStyle } from 'react-native';
import { typography } from './typography';

// ---- Theme mode types ----

/** Modes the user can select. 'system' resolves to light or darkGray at runtime. */
export type ThemeMode = 'light' | 'darkGray' | 'darkMatte' | 'amoledBlack' | 'system';

/** Resolved mode (no 'system' — already resolved by ThemeProvider). */
export type ResolvedTheme = 'light' | 'darkGray' | 'darkMatte' | 'amoledBlack';

// ---- Token interfaces ----

export interface ColorTokens {
  bg: {
    base: string;
    surface: string;
    elevated: string;
    input: string;
    subtle: string;
  };
  border: {
    default: string;
    strong: string;
    focus: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  accent: {
    ocean: string;
    oceanDeep: string;
    orange: string;
    orangeDim: string;
    downvote: string;
    save: string;
    green: string;
    gold: string;
  };
  semantic: {
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  depth: string[];
}

export interface ThemeTokens {
  colors: ColorTokens;
  spacing: {
    xs: number;   // 4
    sm: number;   // 8
    md: number;   // 16
    lg: number;   // 24
    xl: number;   // 32
    xxl: number;  // 48
  };
  typography: typeof typography;
  borderRadius: {
    sm: number;   // 4
    md: number;   // 8
    lg: number;   // 12
    xl: number;   // 16
    full: number; // 9999
  };
  elevation: {
    none: ViewStyle;
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
  };
}

// ---- Shared values ----

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const borderRadius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };

// Elevation shadows differ by platform
function makeShadow(offset: number, radius: number, opacity: number): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: offset },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation: offset * 2,
    },
    default: {},
  }) as ViewStyle;
}

const elevation = {
  none: {} as ViewStyle,
  sm: makeShadow(1, 2, 0.1),
  md: makeShadow(2, 4, 0.15),
  lg: makeShadow(4, 8, 0.2),
};

// ---- Thread depth colors (6+ distinct, adjusted per theme) ----

const darkDepth  = ['#3B9FD4', '#5A72E8', '#46C4A0', '#8B5CF6', '#EC8C3E', '#3BCCD4'];
const lightDepth = ['#0969DA', '#4969C8', '#1A7F37', '#8250DF', '#BF5815', '#0891B2'];

// ---- Theme definitions ----

export const lightColors: ColorTokens = {
  bg: {
    base: '#FAFAFA',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    input: '#F0F2F5',
    subtle: '#E8ECF0',
  },
  border: { default: '#D0D7DE', strong: '#AFB8C1', focus: '#0969DA' },
  text: { primary: '#1A1A1A', secondary: '#666666', muted: '#8B949E', inverse: '#FAFAFA' },
  accent: {
    ocean: '#0969DA', oceanDeep: '#0550AE',
    orange: '#FF4500', orangeDim: '#FF450020',
    downvote: '#4969C8', save: '#BF8700', green: '#1A7F37', gold: '#9A6700',
  },
  semantic: { error: '#CF222E', success: '#1A7F37', warning: '#9A6700', info: '#0969DA' },
  depth: lightDepth,
};

export const darkGrayColors: ColorTokens = {
  bg: {
    base: '#121212',
    surface: '#1E1E1E',
    elevated: '#2A2A2A',
    input: '#2C2C2C',
    subtle: '#333333',
  },
  border: { default: '#3A3A3A', strong: '#505050', focus: '#58A6FF' },
  text: { primary: '#E0E0E0', secondary: '#A0A0A0', muted: '#707070', inverse: '#121212' },
  accent: {
    ocean: '#58A6FF', oceanDeep: '#388BFD',
    orange: '#FF4500', orangeDim: '#FF450026',
    downvote: '#79A6FF', save: '#F0C040', green: '#3FB950', gold: '#D29922',
  },
  semantic: { error: '#F85149', success: '#3FB950', warning: '#D29922', info: '#58A6FF' },
  depth: darkDepth,
};

export const darkMatteColors: ColorTokens = {
  bg: {
    base: '#0D1117',
    surface: '#161B22',
    elevated: '#1C2128',
    input: '#21262D',
    subtle: '#262C36',
  },
  border: { default: '#30363D', strong: '#444C56', focus: '#3B9FD4' },
  text: { primary: '#E0E0E0', secondary: '#8B949E', muted: '#484F58', inverse: '#0D1117' },
  accent: {
    ocean: '#3B9FD4', oceanDeep: '#1F6B9A',
    orange: '#FF4500', orangeDim: '#FF450026',
    downvote: '#5B8AF0', save: '#F0C040', green: '#3FB950', gold: '#D29922',
  },
  semantic: { error: '#F85149', success: '#3FB950', warning: '#D29922', info: '#3B9FD4' },
  depth: darkDepth,
};

export const amoledBlackColors: ColorTokens = {
  bg: {
    base: '#000000',
    surface: '#0A0A0A',
    elevated: '#141414',
    input: '#1A1A1A',
    subtle: '#1E1E1E',
  },
  border: { default: '#2A2A2A', strong: '#3A3A3A', focus: '#58A6FF' },
  text: { primary: '#E0E0E0', secondary: '#B0B0B0', muted: '#666666', inverse: '#000000' },
  accent: {
    ocean: '#58A6FF', oceanDeep: '#388BFD',
    orange: '#FF4500', orangeDim: '#FF450026',
    downvote: '#79A6FF', save: '#F0C040', green: '#3FB950', gold: '#D29922',
  },
  semantic: { error: '#F85149', success: '#3FB950', warning: '#D29922', info: '#58A6FF' },
  depth: darkDepth,
};

// ---- Assembled themes ----

function makeTheme(colors: ColorTokens): ThemeTokens {
  return { colors, spacing, typography, borderRadius, elevation };
}

export const themes: Record<ResolvedTheme, ThemeTokens> = {
  light: makeTheme(lightColors),
  darkGray: makeTheme(darkGrayColors),
  darkMatte: makeTheme(darkMatteColors),
  amoledBlack: makeTheme(amoledBlackColors),
};
