import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './SettingsContext';
import DetailHeader from './DetailHeader';

export default function LanguageScreen({ navigation }) {
  const { settings, updateSetting } = useSettings();

  const languages = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: '简体中文' },
    { code: 'ko', name: '한국어' },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F7F9FB]`}>
      <DetailHeader title="言語設定" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
          {languages.map((l, index) => {
            const isLast = index === languages.length - 1;
            return (
              <TouchableOpacity
                key={l.code}
                style={tw`flex-row items-center justify-between py-[18px] ${!isLast ? 'border-b border-[#EAEAEA]' : ''}`}
                onPress={() => updateSetting(['language'], l.code)}
              >
                <Text style={tw`text-[18px] text-[#1C1C1E] ml-[10px]`}>{l.name}</Text>
                {settings.language === l.code && <Ionicons name="checkmark" size={22} color="#1E3D37" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
