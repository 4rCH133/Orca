// ---- Native module mocks for Jest (Node.js environment) ----

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// MMKV mock with shared in-memory Map
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: jest.fn((key) => {
        const v = store.get(key);
        return typeof v === 'string' ? v : undefined;
      }),
      getBoolean: jest.fn((key) => {
        const v = store.get(key);
        return typeof v === 'boolean' ? v : undefined;
      }),
      set: jest.fn((key, value) => store.set(key, value)),
      _store: store, // exposed for test manipulation
    })),
    __mockStore: store, // global access for tests to pre-seed
  };
});

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  AuthRequest: jest.fn(),
  ResponseType: { Code: 'code' },
  makeRedirectUri: jest.fn(() => 'test://callback'),
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mock-state-hash'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

// Reanimated mock (v4)
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: { createAnimatedComponent: (c) => c },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((v) => v),
    withRepeat: jest.fn((v) => v),
    Easing: { inOut: jest.fn(() => jest.fn()), ease: jest.fn() },
    createAnimatedComponent: (c) => c,
  };
});

// expo-router mock
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() })),
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn((cb) => { if (typeof cb === 'function') cb(); }),
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  Link: ({ children }) => children,
}));

// lucide-react-native mock — return null component for any icon
jest.mock('lucide-react-native', () =>
  new Proxy(
    {},
    {
      get: (_, name) => {
        if (name === '__esModule') return true;
        return () => null;
      },
    },
  ),
);

// @shopify/flash-list mock — use FlatList as stand-in
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return { FlashList: FlatList };
});

// expo-image mock
jest.mock('expo-image', () => ({
  Image: () => null,
}));

// Markdown display mock
jest.mock('@ronradtke/react-native-markdown-display', () => {
  const { Text } = require('react-native');
  return function MockMarkdown(props) {
    return require('react').createElement(Text, null, props.children);
  };
});

// react-native-svg mock
jest.mock('react-native-svg', () => {
  const View = require('react-native').View;
  return {
    Svg: View,
    Path: View,
    Circle: View,
    Ellipse: View,
    default: View,
  };
});
