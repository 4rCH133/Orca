import { formatScore, formatTimeAgo } from '../format';

describe('formatScore', () => {
  it('returns plain number for values under 1000', () => {
    expect(formatScore(0)).toBe('0');
    expect(formatScore(1)).toBe('1');
    expect(formatScore(999)).toBe('999');
  });

  it('formats thousands with k suffix', () => {
    expect(formatScore(1000)).toBe('1.0k');
    expect(formatScore(1500)).toBe('1.5k');
    expect(formatScore(14200)).toBe('14.2k');
    expect(formatScore(999999)).toBe('1000.0k');
  });

  it('formats millions with M suffix', () => {
    expect(formatScore(1000000)).toBe('1.0M');
    expect(formatScore(1500000)).toBe('1.5M');
    expect(formatScore(142800000)).toBe('142.8M');
  });

  it('handles negative numbers as plain strings', () => {
    // formatScore is designed for display scores (always positive or zero)
    // Negative numbers pass through as-is since n < 1000
    expect(formatScore(-5)).toBe('-5');
    expect(formatScore(-1500)).toBe('-1500');
  });
});

describe('formatTimeAgo', () => {
  it('returns a human-readable time string for recent timestamps', () => {
    const oneHourAgo = Date.now() / 1000 - 3600;
    const result = formatTimeAgo(oneHourAgo);
    expect(result).toContain('hour');
    expect(result).toContain('ago');
  });

  it('returns a human-readable time string for older timestamps', () => {
    const oneDayAgo = Date.now() / 1000 - 86400;
    const result = formatTimeAgo(oneDayAgo);
    expect(result).toContain('ago');
  });

  it('handles very recent timestamps', () => {
    const justNow = Date.now() / 1000 - 10;
    const result = formatTimeAgo(justNow);
    expect(result).toContain('second');
  });
});
