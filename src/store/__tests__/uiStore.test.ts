import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({ tabBarVisible: true });
  });

  it('has tabBarVisible true by default', () => {
    expect(useUIStore.getState().tabBarVisible).toBe(true);
  });

  it('sets tabBarVisible to false', () => {
    useUIStore.getState().setTabBarVisible(false);
    expect(useUIStore.getState().tabBarVisible).toBe(false);
  });

  it('sets tabBarVisible back to true', () => {
    useUIStore.getState().setTabBarVisible(false);
    useUIStore.getState().setTabBarVisible(true);
    expect(useUIStore.getState().tabBarVisible).toBe(true);
  });
});
