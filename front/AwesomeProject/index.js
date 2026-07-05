import { registerRootComponent } from 'expo';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// State provider
import { SettingsProvider } from './setting/SettingsContext';

// Screens
import HomeScreen from './Home';
import Setting from './Setting';
import AccountScreen from './Account';
import ScheduleScreen from './Schedule';
import RecordsScreen from './Records';

import { useSettings } from './setting/SettingsContext';

const Stack = createNativeStackNavigator();

function MainNavigator() {
  const { settings } = useSettings();
  
  // If no token exists, force them to start at Account screen to login
  const initialRoute = settings.device.token ? "Home" : "Account";

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Settings" component={Setting} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen name="Records" component={RecordsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <MainNavigator />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);



