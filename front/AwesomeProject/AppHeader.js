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
        <View>
          <Text style={tw`text-[26px] font-bold text-[#0B2B5A] tracking-tighter`}>
            LOudy<Text style={tw`text-[#2BB3B6]`}>Cushion</Text>
          </Text>
          <Text style={tw`text-[#2BB3B6] text-[10px] font-bold mt-[-2px]`}>
            座りすぎに、気づきと行動を。
          </Text>
        </View>
      </View>
    </View>
  );
}
