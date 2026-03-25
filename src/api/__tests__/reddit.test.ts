import { setAccessToken, getFeed } from '../reddit';
import { useRateLimitStore } from '@/store/rateLimitStore';

// Mock auth module to control refreshAccessToken
jest.mock('@/api/auth', () => ({
  refreshAccessToken: jest.fn(),
}));

// Mock Redis to avoid env var issues
jest.mock('@/lib/redis', () => ({
  withCache: jest.fn((_key: string, fetcher: () => Promise<any>) => fetcher()),
  CacheKeys: {
    feed: jest.fn((...args: string[]) => `feed:${args.join(':')}`),
    post: jest.fn((id: string) => `post:${id}`),
    subredditInfo: jest.fn((sub: string) => `subinfo:${sub}`),
  },
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
}));

// Mock authStore
jest.mock('@/store/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ logout: jest.fn() })),
  },
}));

const mockFeedData = {
  data: {
    after: 't3_next',
    before: null,
    children: [{ kind: 't3', data: { id: 'test1', title: 'Test Post' } }],
  },
};

describe('Reddit API client', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
    useRateLimitStore.setState({ remaining: 60, used: 0, resetIn: 600, lastUpdated: 0 });
    setAccessToken('test-token-123');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('calls fetch with correct URL for getFeed', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(mockFeedData),
    });

    const result = await getFeed('hot');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://oauth.reddit.com/hot?limit=25');
  });

  it('includes Authorization Bearer header', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(mockFeedData),
    });

    await getFeed('best');
    const requestHeaders = fetchSpy.mock.calls[0][1]?.headers;
    expect(requestHeaders?.Authorization).toBe('Bearer test-token-123');
  });

  it('includes User-Agent header', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(mockFeedData),
    });

    await getFeed('best');
    const requestHeaders = fetchSpy.mock.calls[0][1]?.headers;
    expect(requestHeaders?.['User-Agent']).toBe('Orca/1.0.0 (by /u/4rCH133)');
  });

  it('returns parsed JSON on success', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(mockFeedData),
    });

    const result = await getFeed('best');
    expect(result.data.children).toHaveLength(1);
    expect(result.data.children[0].data.id).toBe('test1');
  });

  it('parses rate limit headers', async () => {
    const headers = new Headers();
    headers.set('X-Ratelimit-Remaining', '45');
    headers.set('X-Ratelimit-Used', '15');
    headers.set('X-Ratelimit-Reset', '300');

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers,
      json: () => Promise.resolve(mockFeedData),
    });

    await getFeed('hot');
    const rl = useRateLimitStore.getState();
    expect(rl.remaining).toBe(45);
    expect(rl.used).toBe(15);
    expect(rl.resetIn).toBe(300);
  });

  it('throws on non-ok response', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
    });

    await expect(getFeed('best')).rejects.toThrow('Reddit API error: 500');
  });

  it('handles 401 by triggering refresh and retrying', async () => {
    const { refreshAccessToken } = require('@/api/auth');
    refreshAccessToken.mockResolvedValueOnce('new-token-456');

    // First call: 401
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
    });

    // Retry after refresh: success
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(mockFeedData),
    });

    const result = await getFeed('best');
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.data.children).toHaveLength(1);
  });

  it('logs out when refresh returns null', async () => {
    const { refreshAccessToken } = require('@/api/auth');
    const { useAuthStore } = require('@/store/authStore');
    const mockLogout = jest.fn();
    useAuthStore.getState.mockReturnValue({ logout: mockLogout });
    refreshAccessToken.mockResolvedValueOnce(null);

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
    });

    await expect(getFeed('best')).rejects.toThrow('SESSION_EXPIRED');
    expect(mockLogout).toHaveBeenCalled();
  });

  it('includes after parameter in pagination', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(mockFeedData),
    });

    await getFeed('hot', 't3_abc123');
    expect(fetchSpy.mock.calls[0][0]).toBe('https://oauth.reddit.com/hot?limit=25&after=t3_abc123');
  });
});
