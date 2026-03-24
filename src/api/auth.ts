import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CLIENT_ID = process.env.EXPO_PUBLIC_REDDIT_CLIENT_ID!;

// On web, use the Expo proxy redirect URI so Reddit accepts localhost.
// On native (iOS/Android), use the deep-link scheme redirect.
const REDIRECT_URI =
  Platform.OS === 'web'
    ? AuthSession.makeRedirectUri({ useProxy: false, path: '--/expo-auth-session' })
    : process.env.EXPO_PUBLIC_REDDIT_REDIRECT_URI!;

const SCOPES = [
  'identity',
  'read',
  'vote',
  'save',
  'history',
  'mysubreddits',
  'subscribe',
  'submit',
  'edit',
  'privatemessages',
  'report',
];

const TOKEN_KEY = 'reddit_access_token';
const REFRESH_KEY = 'reddit_refresh_token';

export async function startRedditOAuth(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const state = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString()
  );

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
    responseType: AuthSession.ResponseType.Code,
    extraParams: {
      duration: 'permanent',
      state,
    },
    usePKCE: false,
  });

  const discovery = {
    authorizationEndpoint: 'https://www.reddit.com/api/v1/authorize.compact',
  };

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') return null;

  const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${CLIENT_ID}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: result.params.code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });

  const tokens = await tokenResponse.json();
  if (!tokens.access_token) return null;

  await SecureStore.setItemAsync(TOKEN_KEY, tokens.access_token);
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh_token);

  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token };
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refreshToken) return null;

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${CLIENT_ID}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  const data = await response.json();
  if (!data.access_token) return null;

  await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
  return data.access_token;
}

export async function logout() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
