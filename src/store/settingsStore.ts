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
  setTheme: (theme: ThemeMode) => void;
  setFeedLayout: (layout: FeedLayout) => void;
  setAutoPlayVideos: (v: boolean) => void;
  setBlurNSFW: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: loadTheme(),
  feedLayout: (storage.getString('feedLayout') as FeedLayout) ?? 'card',
  autoPlayVideos: storage.getBoolean('autoPlayVideos') ?? false,
  blurNSFW: storage.getBoolean('blurNSFW') ?? true,

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
}));
