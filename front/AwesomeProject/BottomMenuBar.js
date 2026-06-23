import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';

export default function BottomMenuBar({ activeTab, navigation }) {
  // Menu items structure with Home in the center
  const items = [
    { id: 'Records', label: '記録', icon: 'stats-chart', iconOutline: 'stats-chart-outline' },
    { id: 'Schedule', label: 'スケジュール', icon: 'calendar', iconOutline: 'calendar-outline' },
    { id: 'Home', label: 'ホーム', icon: 'home', iconOutline: 'home-outline', isCenter: true },
    { id: 'Account', label: 'アカウント', icon: 'person', iconOutline: 'person-outline' },
    { id: 'Settings', label: '設定', icon: 'settings', iconOutline: 'settings-outline' },
  ];

  const handlePress = (id) => {
    if (id === 'Home') {
      navigation.navigate('Home');
    } else if (id === 'Settings') {
      navigation.navigate('Settings');
    } else if (id === 'Account') {
      navigation.navigate('Account');
    } else if (id === 'Schedule') {
      navigation.navigate('Schedule');
    } else if (id === 'Records') {
      navigation.navigate('Records');
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[
      tw`relative bg-white border-t border-[#EAEAEA] pt-2 flex-row justify-around items-center shadow-lg`,
      { paddingBottom: Math.max(insets.bottom, 16) }
    ]}>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        const iconName = isActive ? item.icon : item.iconOutline;

        if (item.isCenter) {
          // Special floating-like circle button design for Home in the center
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                tw`items-center justify-center rounded-full bg-[#1E3D37] shadow-lg z-10`,
                {
                  width: 60,
                  height: 60,
                  marginTop: -30, // Floats slightly above the bar
                  borderWidth: 4,
                  borderColor: '#FFFFFF',
                }
              ]}
              activeOpacity={0.85}
              onPress={() => handlePress(item.id)}
            >
              <Ionicons name="home" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={item.id}
            style={tw`items-center justify-center flex-1 py-1`}
            activeOpacity={0.7}
            onPress={() => handlePress(item.id)}
          >
            <Ionicons 
              name={iconName} 
              size={22} 
              color={isActive ? '#1E3D37' : '#7E8B93'} 
            />
            <Text 
              style={tw`text-[10px] font-bold mt-1 ${isActive ? 'text-[#1E3D37]' : 'text-[#7E8B93]'}`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
