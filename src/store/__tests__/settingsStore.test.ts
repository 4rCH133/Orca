import { useSettingsStore, getLayoutForFeed, setLayoutForFeed, getDraft, saveDraft, clearDraft, getDismissedTips, dismissTip, getSortForFeed, setSortForFeed } from '../settingsStore';

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

describe('comment draft storage', () => {
  it('returns undefined when no draft exists', () => {
    expect(getDraft('parent_new')).toBeUndefined();
  });

  it('saves and retrieves a draft', () => {
    saveDraft('parent1', 'my reply text');
    expect(getDraft('parent1')).toBe('my reply text');
  });

  it('clears a draft', () => {
    saveDraft('parent2', 'some text');
    clearDraft('parent2');
    // clearDraft sets empty string
    expect(getDraft('parent2')).toBe('');
  });
});

describe('tutorial tip dismissal', () => {
  it('returns empty array initially', () => {
    expect(getDismissedTips()).toEqual([]);
  });

  it('dismissing a tip adds it to the list', () => {
    dismissTip('swipe_vote');
    expect(getDismissedTips()).toContain('swipe_vote');
  });

  it('dismissing same tip twice does not duplicate', () => {
    dismissTip('themes');
    dismissTip('themes');
    const tips = getDismissedTips();
    expect(tips.filter((t: string) => t === 'themes')).toHaveLength(1);
  });
});

describe('sort persistence', () => {
  it('returns "best" as default sort', () => {
    expect(getSortForFeed('home')).toBe('best');
  });

  it('persists and retrieves sort preference', () => {
    setSortForFeed('home', 'new');
    expect(getSortForFeed('home')).toBe('new');
  });

  it('different feeds have independent sorts', () => {
    setSortForFeed('home', 'hot');
    setSortForFeed('space', 'top');
    expect(getSortForFeed('home')).toBe('hot');
    expect(getSortForFeed('space')).toBe('top');
  });
});
