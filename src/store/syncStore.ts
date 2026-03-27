/**
 * Sync store — tracks background activity sync progress.
 * Used by the Likes screen to show sync status and trigger manual syncs.
 */

import { create } from 'zustand';

type SyncPhase = 'upvoted' | 'downvoted' | 'saved';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  totalIndexed: { upvoted: number; downvoted: number; saved: number };
  progress: { current: number; total: number; phase: SyncPhase } | null;
  error: string | null;
  startSync: () => void;
  setSyncComplete: (totals: { upvoted: number; downvoted: number; saved: number }) => void;
  setProgress: (current: number, total: number, phase: SyncPhase) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  totalIndexed: { upvoted: 0, downvoted: 0, saved: 0 },
  progress: null,
  error: null,

  startSync: () => set({ isSyncing: true, error: null, progress: null }),

  setSyncComplete: (totals) => set({
    isSyncing: false,
    lastSyncAt: Date.now(),
    totalIndexed: totals,
    progress: null,
  }),

  setProgress: (current, total, phase) => set({
    progress: { current, total, phase },
  }),

  setError: (error) => set({ error, isSyncing: false }),

  reset: () => set({
    isSyncing: false,
    lastSyncAt: null,
    totalIndexed: { upvoted: 0, downvoted: 0, saved: 0 },
    progress: null,
    error: null,
  }),
}));
