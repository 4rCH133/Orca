import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'settings' });

type Theme = 'system' | 'light' | 'dark' | 'oled';
type FeedLayout = 'card' | 'compact' | 'list';

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
  theme: (storage.getString('theme') as Theme) ?? 'system',
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
