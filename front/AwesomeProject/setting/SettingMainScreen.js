import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './SettingsContext';
import AppHeader from '../AppHeader';
import BottomMenuBar from '../BottomMenuBar';

export default function SettingMainScreen({ navigation }) {
  const { settings } = useSettings();

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F7F9FB]`}>
      <AppHeader />

      <ScrollView contentContainerStyle={tw`px-5 pb-24`} showsVerticalScrollIndicator={false}>
        <View style={tw`bg-white rounded-[24px] p-4 mt-[10px] shadow-sm`}>
          <View style={tw`bg-[#EAF6F3] rounded-[16px] py-[14px] px-5 mb-4`}>
            <Text style={tw`text-[28px] font-bold text-[#1E3D37]`}>設定</Text>
          </View>

          {/* Wi-Fi Setting Highlighted Item */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-between bg-white rounded-[16px] py-[18px] px-4 mb-2 shadow`}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('WifiSetting')}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons name="wifi" size={24} color="#000000" />
              <Text style={tw`text-[20px] font-bold text-black ml-3`}>
                Wi-Fi設定
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#000000" />
          </TouchableOpacity>

          {/* Other Settings List */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-between py-[18px] px-3 border-b border-[#EAEAEA]`}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Details')}
          >
            <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>詳細設定</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-row items-center justify-between py-[18px] px-3 border-b border-[#EAEAEA]`}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('DeviceMgmt')}
          >
            <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>デバイス管理</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-row items-center justify-between py-[18px] px-3 border-b border-[#EAEAEA]`}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>通知のカスタマイズ</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`flex-row items-center justify-between py-[18px] px-3 border-b-0`}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Language')}
          >
            <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>言語設定</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Positioned bottom menu bar */}
      <BottomMenuBar activeTab="Settings" navigation={navigation} />
    </SafeAreaView>
  );
}
