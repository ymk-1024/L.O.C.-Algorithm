import React from 'react';
import { View, Text, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';

export default function AppHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      tw`px-6 pb-3 bg-[#F7F9FB]`,
      { paddingTop: Math.max(insets.top, 12) }
    ]}>
      <View style={tw`flex-row items-center`}>
        <Image 
          source={require('./assets/logo.png')} 
          style={{ width: 40, height: 40, resizeMode: 'contain', marginRight: 10 }} 
        />
        <Text style={tw`text-[26px] font-bold text-black tracking-tighter`}>
          LOudy Cushion
        </Text>
      </View>
    </View>
  );
}
