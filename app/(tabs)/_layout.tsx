import { Tabs } from 'expo-router';
import { Compass, Eye, Heart, Settings2 } from 'lucide-react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';

export default function TabLayout() {
  const { dark } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5147B7',
        tabBarInactiveTintColor: '#9694A0',
        tabBarStyle: { height: 68, paddingTop: 8, paddingBottom: 8, borderTopColor: dark ? '#34333C' : '#ECEBF0', backgroundColor: dark ? '#222229' : '#FFFFFF' },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Compass size={19} color={color} />,
        }}
      />
      <Tabs.Screen
        name="preview"
        options={{
          title: 'Preview',
          tabBarIcon: ({ color }) => <Eye size={18} color={color} />,
        }}
      />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color }) => <Heart size={18} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Settings2 size={18} color={color} /> }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
