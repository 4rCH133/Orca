import { useRateLimitStore } from '../rateLimitStore';

describe('rateLimitStore', () => {
  beforeEach(() => {
    useRateLimitStore.setState({ remaining: 60, used: 0, resetIn: 600, lastUpdated: 0 });
  });

  it('has correct initial state', () => {
    const state = useRateLimitStore.getState();
    expect(state.remaining).toBe(60);
    expect(state.used).toBe(0);
    expect(state.resetIn).toBe(600);
  });

  it('updates rate limit values', () => {
    useRateLimitStore.getState().update(45, 15, 300);
    const state = useRateLimitStore.getState();
    expect(state.remaining).toBe(45);
    expect(state.used).toBe(15);
    expect(state.resetIn).toBe(300);
    expect(state.lastUpdated).toBeGreaterThan(0);
  });

  it('warns when remaining is below 5', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    useRateLimitStore.getState().update(3, 57, 120);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Rate limit low'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('3'));
    warnSpy.mockRestore();
  });

  it('does not warn when remaining is 5 or above', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    useRateLimitStore.getState().update(5, 55, 120);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
