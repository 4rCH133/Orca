import { useGestureStore } from '../gestureStore';

describe('gestureStore', () => {
  beforeEach(() => {
    useGestureStore.setState({
      commentShortRight: 'upvote',
      commentLongRight: 'downvote',
      commentShortLeft: 'reply',
      commentLongLeft: 'collapse',
      postShortRight: 'upvote',
      postLongRight: 'downvote',
      postShortLeft: 'save',
      postLongLeft: 'share',
    });
  });

  it('has correct default gesture config', () => {
    const state = useGestureStore.getState();
    expect(state.commentShortRight).toBe('upvote');
    expect(state.commentLongRight).toBe('downvote');
    expect(state.commentShortLeft).toBe('reply');
    expect(state.commentLongLeft).toBe('collapse');
    expect(state.postShortRight).toBe('upvote');
    expect(state.postLongRight).toBe('downvote');
    expect(state.postShortLeft).toBe('save');
    expect(state.postLongLeft).toBe('share');
  });

  it('remaps a gesture action', () => {
    useGestureStore.getState().setGesture('commentShortRight', 'save');
    expect(useGestureStore.getState().commentShortRight).toBe('save');
  });

  it('remapping one gesture does not affect others', () => {
    useGestureStore.getState().setGesture('postShortLeft', 'reply');
    expect(useGestureStore.getState().postShortLeft).toBe('reply');
    expect(useGestureStore.getState().commentShortRight).toBe('upvote'); // unchanged
  });

  it('resets to defaults', () => {
    useGestureStore.getState().setGesture('commentShortRight', 'copyText');
    useGestureStore.getState().resetDefaults();
    expect(useGestureStore.getState().commentShortRight).toBe('upvote');
  });
});
