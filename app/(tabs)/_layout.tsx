import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF4500',
        tabBarStyle: { backgroundColor: '#1A1A1B', borderTopColor: '#343536' },
        headerStyle: { backgroundColor: '#1A1A1B' },
        headerTintColor: '#D7DADC',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => null }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color }) => null }} />
      <Tabs.Screen name="likes" options={{ title: 'Likes', tabBarIcon: ({ color }) => null }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarIcon: ({ color }) => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => null }} />
    </Tabs>
  );
}
