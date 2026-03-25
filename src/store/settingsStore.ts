import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'settings' });

type Theme = 'system' | 'light' | 'dark' | 'matte';
type FeedLayout = 'card' | 'compact' | 'list';

// Migrate legacy 'oled' theme value to 'matte'
function loadTheme(): Theme {
  const stored = storage.getString('theme');
  if (stored === 'oled') {
    storage.set('theme', 'matte');
    return 'matte';
  }
  return (stored as Theme) ?? 'system';
}

interface SettingsState {
  theme: Theme;
  feedLayout: FeedLayout;
  autoPlayVideos: boolean;
  blurNSFW: boolean;
  setTheme: (theme: Theme) => void;
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
