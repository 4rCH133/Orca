import { useSyncStore } from '../syncStore';

describe('syncStore', () => {
  beforeEach(() => {
    useSyncStore.getState().reset();
  });

  it('has correct initial state', () => {
    const state = useSyncStore.getState();
    expect(state.isSyncing).toBe(false);
    expect(state.lastSyncAt).toBeNull();
    expect(state.totalIndexed).toEqual({ upvoted: 0, downvoted: 0, saved: 0 });
    expect(state.progress).toBeNull();
    expect(state.error).toBeNull();
  });

  it('startSync sets isSyncing to true and clears error', () => {
    useSyncStore.getState().setError('old error');
    useSyncStore.getState().startSync();
    const state = useSyncStore.getState();
    expect(state.isSyncing).toBe(true);
    expect(state.error).toBeNull();
  });

  it('setSyncComplete updates totals and timestamp', () => {
    useSyncStore.getState().startSync();
    useSyncStore.getState().setSyncComplete({ upvoted: 100, downvoted: 20, saved: 50 });
    const state = useSyncStore.getState();
    expect(state.isSyncing).toBe(false);
    expect(state.lastSyncAt).toBeGreaterThan(0);
    expect(state.totalIndexed).toEqual({ upvoted: 100, downvoted: 20, saved: 50 });
    expect(state.progress).toBeNull();
  });

  it('setProgress updates current progress', () => {
    useSyncStore.getState().setProgress(5, 10, 'upvoted');
    const state = useSyncStore.getState();
    expect(state.progress).toEqual({ current: 5, total: 10, phase: 'upvoted' });
  });

  it('setError stores error and stops syncing', () => {
    useSyncStore.getState().startSync();
    useSyncStore.getState().setError('Network error');
    const state = useSyncStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.isSyncing).toBe(false);
  });

  it('reset clears all state', () => {
    useSyncStore.getState().setSyncComplete({ upvoted: 50, downvoted: 10, saved: 30 });
    useSyncStore.getState().reset();
    const state = useSyncStore.getState();
    expect(state.isSyncing).toBe(false);
    expect(state.lastSyncAt).toBeNull();
    expect(state.totalIndexed).toEqual({ upvoted: 0, downvoted: 0, saved: 0 });
  });
});
