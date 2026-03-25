import { useSettingsStore, getLayoutForFeed, setLayoutForFeed } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      theme: 'system',
      feedLayout: 'card',
      autoPlayVideos: false,
      blurNSFW: true,
      dimReadPosts: true,
      hideReadPosts: false,
    });
  });

  it('has correct defaults', () => {
    const s = useSettingsStore.getState();
    expect(s.feedLayout).toBe('card');
    expect(s.dimReadPosts).toBe(true);
    expect(s.hideReadPosts).toBe(false);
    expect(s.blurNSFW).toBe(true);
    expect(s.autoPlayVideos).toBe(false);
  });

  it('updates feedLayout', () => {
    useSettingsStore.getState().setFeedLayout('compact');
    expect(useSettingsStore.getState().feedLayout).toBe('compact');
  });

  it('updates theme', () => {
    useSettingsStore.getState().setTheme('darkMatte');
    expect(useSettingsStore.getState().theme).toBe('darkMatte');
  });

  it('updates dimReadPosts', () => {
    useSettingsStore.getState().setDimReadPosts(false);
    expect(useSettingsStore.getState().dimReadPosts).toBe(false);
  });

  it('updates hideReadPosts', () => {
    useSettingsStore.getState().setHideReadPosts(true);
    expect(useSettingsStore.getState().hideReadPosts).toBe(true);
  });
});

describe('per-feed layout overrides', () => {
  beforeEach(() => {
    useSettingsStore.setState({ feedLayout: 'card' });
  });

  it('returns global default when no per-feed override exists', () => {
    expect(getLayoutForFeed('home')).toBe('card');
  });

  it('returns per-feed override after setting it', () => {
    setLayoutForFeed('home', 'list');
    expect(getLayoutForFeed('home')).toBe('list');
  });

  it('different feeds have independent overrides', () => {
    setLayoutForFeed('home', 'compact');
    setLayoutForFeed('reactnative', 'list');
    expect(getLayoutForFeed('home')).toBe('compact');
    expect(getLayoutForFeed('reactnative')).toBe('list');
  });
});
