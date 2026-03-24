import { create } from 'zustand';
import { startRedditOAuth, getStoredToken, refreshAccessToken, logout } from '@/api/auth';
import { setAccessToken, getMe, RedditUser } from '@/api/reddit';

interface AuthState {
  user: RedditUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }

      setAccessToken(token);

      try {
        const user = await getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (e: any) {
        if (e.message === 'TOKEN_EXPIRED') {
          const newToken = await refreshAccessToken();
          if (newToken) {
            setAccessToken(newToken);
            const user = await getMe();
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async () => {
    set({ isLoading: true });
    const tokens = await startRedditOAuth();
    if (!tokens) {
      set({ isLoading: false });
      return;
    }
    setAccessToken(tokens.accessToken);
    const user = await getMe();
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await logout();
    set({ user: null, isAuthenticated: false });
  },
}));
