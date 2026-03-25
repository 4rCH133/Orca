import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>{symbol}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent.ocean,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.bg.base,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border.default,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
        headerStyle: { backgroundColor: colors.bg.base },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontWeight: '700', color: colors.text.primary },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: '◈ Orca',
          tabBarIcon: ({ focused }) => <TabIcon symbol="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon symbol="⌕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: 'Likes',
          tabBarIcon: ({ focused }) => <TabIcon symbol="◆" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ focused }) => <TabIcon symbol="✉" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon symbol="◉" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 18, color: colors.text.muted },
  iconFocused: { color: colors.accent.ocean },
});
