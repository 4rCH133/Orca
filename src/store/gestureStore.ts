/**
 * Gesture configuration store — customizable swipe actions for comments and posts.
 * Persisted to MMKV. Uses same storage pattern as settingsStore.
 */

import { create } from 'zustand';

export type GestureAction =
  | 'upvote' | 'downvote' | 'reply' | 'save' | 'collapse'
  | 'share' | 'copyText' | 'copyLink' | 'report' | 'profile' | 'none';

export interface GestureConfig {
  commentShortRight: GestureAction;
  commentLongRight: GestureAction;
  commentShortLeft: GestureAction;
  commentLongLeft: GestureAction;
  postShortRight: GestureAction;
  postLongRight: GestureAction;
  postShortLeft: GestureAction;
  postLongLeft: GestureAction;
}

const DEFAULT_CONFIG: GestureConfig = {
  commentShortRight: 'upvote',
  commentLongRight: 'downvote',
  commentShortLeft: 'reply',
  commentLongLeft: 'collapse',
  postShortRight: 'upvote',
  postLongRight: 'downvote',
  postShortLeft: 'save',
  postLongLeft: 'share',
};

// Use try-catch for MMKV (same pattern as settingsStore)
function loadConfig(): GestureConfig {
  try {
    const { MMKV } = require('react-native-mmkv');
    const storage = new MMKV({ id: 'gestures' });
    const stored = storage.getString('config');
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function persistConfig(config: GestureConfig) {
  try {
    const { MMKV } = require('react-native-mmkv');
    const storage = new MMKV({ id: 'gestures' });
    storage.set('config', JSON.stringify(config));
  } catch {}
}

interface GestureState extends GestureConfig {
  setGesture: (key: keyof GestureConfig, action: GestureAction) => void;
  resetDefaults: () => void;
}

export const useGestureStore = create<GestureState>((set, get) => ({
  ...loadConfig(),

  setGesture: (key, action) => {
    set({ [key]: action });
    persistConfig({ ...get(), [key]: action });
  },

  resetDefaults: () => {
    set(DEFAULT_CONFIG);
    persistConfig(DEFAULT_CONFIG);
  },
}));
