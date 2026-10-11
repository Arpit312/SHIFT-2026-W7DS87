import { Tabs } from 'expo-router';
import { BatteryCharging, Bot, FilePlus, Home, User, WalletCards } from 'lucide-react-native';

import { ChargeColors as C } from '../../constants/charge-theme';

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.orange,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          minHeight: 68,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
        sceneStyle: { backgroundColor: C.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-check"
        options={{
          title: 'AI Check',
          tabBarIcon: ({ color }) => <Bot size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="new-request"
        options={{
          title: 'Request',
          tabBarIcon: ({ color }) => <FilePlus size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Bills',
          tabBarIcon: ({ color }) => <WalletCards size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="packet"
        options={{
          href: null,
          title: 'Haan Packet',
          tabBarIcon: ({ color }) => <BatteryCharging size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

