import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

// メニュー１
function HomeScreen() {
  return (
    <View style={styles.center}>
      <Text>ホーム</Text>
    </View>  
  )
}
export default function App() {
  return (
    <View style={styles.container}>
      <Text></Text>
      <StatusBar 
      style="auto" 
      backgroundColor="#d4f6f3"
      />
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d4f6f3',
    paddingTop: 20,
    alignItems: 'center',
  },
  center:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
