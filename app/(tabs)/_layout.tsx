import { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Animated } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/useTheme';
import { useUIStore } from '@/store/uiStore';
import {
  DorsalFinIcon,
  OrcaEyeIcon,
  SplashIcon,
  TailFlukeIcon,
  OrcaHeadIcon,
} from '@/components/icons/TabIcons';

function AnimatedTabBar(props: BottomTabBarProps) {
  const visible = useUIStore((s) => s.tabBarVisible);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 90,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: c.accent.ocean,
        tabBarInactiveTintColor: c.text.muted,
        tabBarStyle: {
          backgroundColor: c.bg.base,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.border.default,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
        headerStyle: { backgroundColor: c.bg.base },
        headerTintColor: c.text.primary,
        headerTitleStyle: { fontWeight: '700', color: c.text.primary },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          headerTitle: '◈ Orca',
          tabBarIcon: ({ color }) => <DorsalFinIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => <OrcaEyeIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: 'Likes',
          tabBarLabel: 'Likes',
          tabBarIcon: ({ color }) => <SplashIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox/index"
        options={{
          title: 'Inbox',
          tabBarLabel: 'Inbox',
          tabBarIcon: ({ color }) => <TailFlukeIcon size={22} color={color} />,
          tabBarBadge: undefined,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <OrcaHeadIcon size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
