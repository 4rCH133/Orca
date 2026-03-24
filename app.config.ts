import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Orca',
  slug: 'orca',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FF4500', // Reddit orange
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourcompany.orca',
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'Orca needs access to save images.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FF4500',
    },
    package: 'com.yourcompany.orca',
    permissions: ['NOTIFICATIONS', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-sqlite',
    'expo-notifications',
    [
      'expo-av',
      {
        microphonePermission: false,
      },
    ],
  ],
  scheme: 'orca',
  extra: {
    redditClientId: process.env.EXPO_PUBLIC_REDDIT_CLIENT_ID,
    redditRedirectUri: process.env.EXPO_PUBLIC_REDDIT_REDIRECT_URI,
    eas: {
      projectId: 'YOUR_EAS_PROJECT_ID',
    },
  },
});
