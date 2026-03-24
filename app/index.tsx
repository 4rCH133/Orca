import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(auth)/login'} />;
}
