import { Tabs } from 'expo-router';
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs();

export default function Layout() {
  return (
    <Tabs.Screen
    name="Home"
    options={{
        title: 'ホーム',
        href: '/',
    }}
    />
  );
}