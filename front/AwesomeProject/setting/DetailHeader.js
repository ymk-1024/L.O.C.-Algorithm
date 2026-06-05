import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

export default function DetailHeader({ title, onBack }) {
  return (
    <View style={tw`flex-row items-center justify-between px-4 py-3 bg-[#F7F9FB]`}>
      <TouchableOpacity 
        style={tw`w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm`} 
        onPress={onBack} 
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={tw`text-xl font-bold text-black`}>{title}</Text>
      <View style={tw`w-10`} />
    </View>
  );
}
