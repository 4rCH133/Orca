import { create } from 'zustand';

interface UIState {
  /** Whether the bottom tab bar is visible (hidden on scroll-down) */
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  tabBarVisible: true,
  setTabBarVisible: (tabBarVisible) => set({ tabBarVisible }),
}));
