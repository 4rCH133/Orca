import { create } from 'zustand';

interface RateLimitState {
  /** Requests remaining in current window */
  remaining: number;
  /** Requests used in current window */
  used: number;
  /** Seconds until rate limit window resets */
  resetIn: number;
  /** Timestamp of last update */
  lastUpdated: number;
  /** Update from Reddit response headers */
  update: (remaining: number, used: number, resetIn: number) => void;
}

export const useRateLimitStore = create<RateLimitState>((set) => ({
  remaining: 60,
  used: 0,
  resetIn: 600,
  lastUpdated: 0,

  update: (remaining, used, resetIn) => {
    if (remaining < 5) {
      console.warn(`[Orca] Rate limit low: ${remaining} requests remaining, resets in ${resetIn}s`);
    }
    set({ remaining, used, resetIn, lastUpdated: Date.now() });
  },
}));
