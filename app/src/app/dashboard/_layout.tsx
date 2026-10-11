import { Tabs } from 'expo-router';
import { LayoutDashboard, FilePlus, User } from 'lucide-react-native';

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#111113',
          borderTopColor: '#2A2A2F',
        },
        tabBarActiveTintColor: '#FF7A1A',
        tabBarInactiveTintColor: '#A3A3AD',
        headerStyle: {
          backgroundColor: '#111113',
        },
        headerTintColor: '#F4F1EA',
        contentStyle: { backgroundColor: '#0A0A0B' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="new-request"
        options={{
          title: 'New Request',
          tabBarIcon: ({ color }) => <FilePlus size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
