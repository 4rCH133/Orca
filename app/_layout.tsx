import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';
import { Toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60, // 1 minute default
    },
  },
});

function ThemedStack() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: c.bg.base },
        headerTintColor: c.text.primary,
        headerTitleStyle: { fontWeight: '700', color: c.text.primary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.bg.base },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="r/[subreddit]" options={{ headerShown: true }} />
      <Stack.Screen name="post/[id]" options={{ headerShown: true }} />
    </Stack>
  );
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <View style={StyleSheet.absoluteFill}>
              <ThemedStack />
              <Toast />
            </View>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
