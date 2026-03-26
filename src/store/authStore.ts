import { create } from 'zustand';
import { startRedditOAuth, getStoredToken, refreshAccessToken, logout } from '@/api/auth';
import { setAccessToken, getMe, RedditUser } from '@/api/reddit';
import { upsertSupabaseUser, ensureUserPreferences } from '@/lib/supabase';
import { syncUserActivity, syncIncrementalActivity } from '@/db/sync';
import { useSyncStore } from '@/store/syncStore';
import { MOCK_MODE, mockUser } from '@/dev';

interface AuthState {
  user: RedditUser | null;
  supabaseUserId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

/** Sync user data after successful Reddit auth. Non-blocking — failures are logged, not thrown. */
async function postLoginSync(user: RedditUser, set: (s: Partial<AuthState>) => void) {
  // 1. Supabase user upsert (for cross-device sync)
  try {
    const sbId = await upsertSupabaseUser(user);
    if (sbId) {
      await ensureUserPreferences(sbId);
      set({ supabaseUserId: sbId });
    }
  } catch (e) {
    console.warn('[Orca] Supabase sync failed:', e);
  }

  // 2. Backfill local SQLite with Reddit vote/save history (for offline search)
  // Uses syncStore for progress tracking; runs in background
  syncUserActivity(user.name).catch((e) => {
    console.warn('[Orca] Activity sync failed:', e);
    useSyncStore.getState().setError('Sync failed — will retry later');
  });

  // 3. Set up incremental sync every 30 minutes when app foregrounds
  // (AppState listener should be set up once, not on every login)
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  supabaseUserId: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    if (MOCK_MODE) {
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
      return;
    }

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
        postLoginSync(user, set);
      } catch (e: any) {
        if (e.message === 'TOKEN_EXPIRED' || e.message === 'SESSION_EXPIRED') {
          const newToken = await refreshAccessToken();
          if (newToken) {
            setAccessToken(newToken);
            const user = await getMe();
            set({ user, isAuthenticated: true, isLoading: false });
            postLoginSync(user, set);
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
    if (MOCK_MODE) {
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
      return;
    }
    set({ isLoading: true });
    const tokens = await startRedditOAuth();
    if (!tokens) {
      set({ isLoading: false });
      return;
    }
    setAccessToken(tokens.accessToken);
    const user = await getMe();
    set({ user, isAuthenticated: true, isLoading: false });
    postLoginSync(user, set);
  },

  logout: async () => {
    if (!MOCK_MODE) await logout();
    useSyncStore.getState().reset();
    set({ user: null, supabaseUserId: null, isAuthenticated: false });
  },
}));
