/**
 * Orca Design System — Colors
 * Deep-sea matte palette inspired by the orca: intelligent, calm, fast.
 * Ocean blues as primary interactive. Orange reserved for upvotes only.
 */

export const colors = {
  // Backgrounds — matte deep-sea layers, easy on the eyes
  bg: {
    base: '#0D1117',       // Deep midnight — app background
    surface: '#161B22',    // Cards, sheets
    elevated: '#1C2128',   // Modals, popovers
    input: '#21262D',      // Input fields, search bar
    subtle: '#262C36',     // Dividers, skeleton fills
  },

  // Borders
  border: {
    default: '#30363D',
    strong: '#444C56',
    focus: '#3B9FD4',      // Ocean blue focus ring
  },

  // Text — off-white to grey, no harsh pure white
  text: {
    primary: '#E6EDF3',    // Primary content
    secondary: '#8B949E',  // Metadata, timestamps, author
    muted: '#484F58',      // Placeholders, disabled
    inverse: '#0D1117',    // Text on light backgrounds
  },

  // Accent — precisely scoped usage
  accent: {
    ocean: '#3B9FD4',      // Primary interactive — tabs, links, focus
    oceanDeep: '#1F6B9A',  // Pressed/active ocean states
    orange: '#FF4500',     // Upvotes ONLY — Reddit orange
    orangeDim: '#FF450026',
    downvote: '#5B8AF0',   // Downvotes — periwinkle blue
    save: '#F0C040',       // Saved/bookmarked posts — warm gold
    green: '#3FB950',      // OP badge, success states
    gold: '#D29922',       // Awards
  },

  // Comment thread depth indent colors (6 cycling ocean shades, used at 40% opacity)
  depth: [
    '#3B9FD4',  // ocean blue
    '#5A72E8',  // blue-indigo
    '#46C4A0',  // teal
    '#8B5CF6',  // violet
    '#EC8C3E',  // amber
    '#3BCCD4',  // cyan
  ],

  // Orca brand (splash, onboarding)
  orca: {
    midnight: '#0D1117',
    white: '#E6EDF3',
    grey: '#8B949E',
  },
} as const;

export type Colors = typeof colors;
