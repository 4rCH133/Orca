import { create } from 'zustand';
import type { ThemeMode } from '@/theme/tokens';

type FeedLayout = 'card' | 'compact' | 'list';

// MMKV v3 requires TurboModules. Wrap in try-catch so Expo Go / web
// fall back to an in-memory map with the same API surface.
interface KVStorage {
  getString(key: string): string | undefined;
  getBoolean(key: string): boolean | undefined;
  set(key: string, value: string | boolean | number): void;
}

function createStorage(): KVStorage {
  try {
    const { MMKV } = require('react-native-mmkv');
    return new MMKV({ id: 'settings' });
  } catch {
    // Fallback: in-memory store (Expo Go, web, or missing TurboModules)
    const map = new Map<string, string | boolean | number>();
    return {
      getString: (key) => {
        const v = map.get(key);
        return typeof v === 'string' ? v : undefined;
      },
      getBoolean: (key) => {
        const v = map.get(key);
        return typeof v === 'boolean' ? v : undefined;
      },
      set: (key, value) => map.set(key, value),
    };
  }
}

const storage = createStorage();

// Migrate legacy theme values to current set
function loadTheme(): ThemeMode {
  const stored = storage.getString('theme');
  // Legacy migrations
  if (stored === 'oled') {
    storage.set('theme', 'amoledBlack');
    return 'amoledBlack';
  }
  if (stored === 'matte' || stored === 'dark') {
    storage.set('theme', 'darkMatte');
    return 'darkMatte';
  }
  // Validate against known modes
  const valid: ThemeMode[] = ['system', 'light', 'darkGray', 'darkMatte', 'amoledBlack'];
  if (stored && valid.includes(stored as ThemeMode)) {
    return stored as ThemeMode;
  }
  return 'system';
}

interface SettingsState {
  theme: ThemeMode;
  feedLayout: FeedLayout;
  autoPlayVideos: boolean;
  blurNSFW: boolean;
  dimReadPosts: boolean;
  hideReadPosts: boolean;
  showNewComments: boolean;
  setTheme: (theme: ThemeMode) => void;
  setFeedLayout: (layout: FeedLayout) => void;
  setAutoPlayVideos: (v: boolean) => void;
  setBlurNSFW: (v: boolean) => void;
  setDimReadPosts: (v: boolean) => void;
  setHideReadPosts: (v: boolean) => void;
  setShowNewComments: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: loadTheme(),
  feedLayout: (storage.getString('feedLayout') as FeedLayout) ?? 'card',
  autoPlayVideos: storage.getBoolean('autoPlayVideos') ?? false,
  blurNSFW: storage.getBoolean('blurNSFW') ?? true,
  dimReadPosts: storage.getBoolean('dimReadPosts') ?? true,
  hideReadPosts: storage.getBoolean('hideReadPosts') ?? false,
  showNewComments: storage.getBoolean('showNewComments') ?? true,

  setTheme: (theme) => {
    storage.set('theme', theme);
    set({ theme });
  },
  setFeedLayout: (feedLayout) => {
    storage.set('feedLayout', feedLayout);
    set({ feedLayout });
  },
  setAutoPlayVideos: (autoPlayVideos) => {
    storage.set('autoPlayVideos', autoPlayVideos);
    set({ autoPlayVideos });
  },
  setBlurNSFW: (blurNSFW) => {
    storage.set('blurNSFW', blurNSFW);
    set({ blurNSFW });
  },
  setDimReadPosts: (dimReadPosts) => {
    storage.set('dimReadPosts', dimReadPosts);
    set({ dimReadPosts });
  },
  setHideReadPosts: (hideReadPosts) => {
    storage.set('hideReadPosts', hideReadPosts);
    set({ hideReadPosts });
  },
  setShowNewComments: (showNewComments) => {
    storage.set('showNewComments', showNewComments);
    set({ showNewComments });
  },
}));

// ---- Per-feed layout overrides (standalone MMKV functions, not reactive state) ----

export function getLayoutForFeed(feedKey: string): FeedLayout {
  const override = storage.getString(`layout:${feedKey}`);
  if (override === 'card' || override === 'compact' || override === 'list') return override;
  return useSettingsStore.getState().feedLayout;
}

export function setLayoutForFeed(feedKey: string, layout: FeedLayout): void {
  storage.set(`layout:${feedKey}`, layout);
}

// ---- Per-feed sort persistence ----

export function getSortForFeed(feedKey: string): string {
  return storage.getString(`sort:${feedKey}`) ?? 'best';
}

export function setSortForFeed(feedKey: string, sort: string): void {
  storage.set(`sort:${feedKey}`, sort);
}

// ---- Comment draft storage ----

export function getDraft(parentId: string): string | undefined {
  return storage.getString(`draft:comment:${parentId}`);
}

export function saveDraft(parentId: string, text: string): void {
  storage.set(`draft:comment:${parentId}`, text);
}

export function clearDraft(parentId: string): void {
  storage.set(`draft:comment:${parentId}`, '');
}

// ---- Tutorial tip dismissal ----

export function getDismissedTips(): string[] {
  const raw = storage.getString('dismissed_tips');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function dismissTip(tipId: string): void {
  const current = getDismissedTips();
  if (!current.includes(tipId)) {
    storage.set('dismissed_tips', JSON.stringify([...current, tipId]));
  }
}
