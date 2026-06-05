import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

export default function AppHeader() {
  return (
    <View style={tw`px-6 pb-3 bg-[#F7F9FB] ${Platform.OS === 'android' ? 'pt-4' : 'pt-3'}`}>
      <View style={tw`flex-row items-center`}>
        <View style={tw`relative justify-center items-center mr-[10px]`}>
          <Ionicons name="shield" size={36} color="#7E8B93" />
          <View style={tw`absolute top-0 left-0 right-0 bottom-0 justify-center items-center pb-[2px]`}>
            <Text style={tw`text-white text-[11px] font-bold`}>SG</Text>
          </View>
        </View>
        <Text style={tw`text-[26px] font-bold text-black tracking-tighter`}>
          StandUpGuardian
        </Text>
      </View>
    </View>
  );
}
