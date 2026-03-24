/**
 * Orca Design System — Colors
 * Inspired by the orca: stark black, pure white, intelligent contrast.
 * One sharp accent (Reddit orange) used sparingly for action/emphasis only.
 */

export const colors = {
  // Backgrounds — true black layers, like deep ocean
  bg: {
    base: '#000000',       // OLED true black — app background
    surface: '#0D0D0E',    // Cards, sheets
    elevated: '#161617',   // Modals, popovers
    input: '#1A1A1B',      // Input fields
    subtle: '#1E1E1F',     // Dividers, subtle fills
  },

  // Borders
  border: {
    default: '#2A2A2B',
    strong: '#3A3A3B',
  },

  // Text — white to grey spectrum
  text: {
    primary: '#F0F0F0',    // Primary content
    secondary: '#A8A8A8',  // Metadata, timestamps
    muted: '#5A5A5C',      // Placeholders, disabled
    inverse: '#000000',    // Text on light backgrounds
  },

  // Accent — used ONLY for interactive actions (votes, buttons, links)
  accent: {
    primary: '#FF4500',    // Reddit orange — upvotes, CTAs
    primaryDim: '#FF450026',
    blue: '#7193FF',       // Downvotes
    green: '#46D160',      // OP badge, success
    gold: '#FFB000',       // Awards
  },

  // Orca signature gradient (for splash, onboarding)
  orca: {
    black: '#000000',
    white: '#FFFFFF',
    grey: '#8A8A8A',
  },
} as const;

export type Colors = typeof colors;
