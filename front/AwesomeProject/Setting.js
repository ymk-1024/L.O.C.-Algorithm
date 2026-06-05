import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import local components from 'setting' directory
import SettingMainScreen from './setting/SettingMainScreen';
import WifiSettingScreen from './setting/WifiSettingScreen';
import DetailsScreen from './setting/DetailsScreen';
import DeviceMgmtScreen from './setting/DeviceMgmtScreen';
import NotificationsScreen from './setting/NotificationsScreen';
import LanguageScreen from './setting/LanguageScreen';

const Stack = createNativeStackNavigator();

export default function Setting() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SettingMain" component={SettingMainScreen} />
      <Stack.Screen name="WifiSetting" component={WifiSettingScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="DeviceMgmt" component={DeviceMgmtScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
    </Stack.Navigator>
  );
}
