import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './SettingsContext';
import DetailHeader from './DetailHeader';

export default function DetailsScreen({ navigation }) {
  const { settings, updateSetting } = useSettings();

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F7F9FB]`}>
      <DetailHeader title="詳細設定" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={tw`px-5 pb-10`}>
        {/* Reminder Interval */}
        <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>起立リマインダー間隔</Text>
        <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
          <View style={tw`flex-row items-center justify-between py-[10px]`}>
            <TouchableOpacity
              style={tw`w-12 h-12 rounded-full bg-[#F2F2F7] items-center justify-center`}
              onPress={() => updateSetting(['reminderIntervalMinutes'], Math.max(15, settings.reminderIntervalMinutes - 15))}
            >
              <Ionicons name="remove" size={24} color="#1E3D37" />
            </TouchableOpacity>
            <View style={tw`flex-row items-baseline`}>
              <Text style={tw`text-[32px] font-bold text-[#1E3D37]`}>{settings.reminderIntervalMinutes}</Text>
              <Text style={tw`text-[16px] font-semibold text-[#7E8B93] ml-[6px]`}>分</Text>
            </View>
            <TouchableOpacity
              style={tw`w-12 h-12 rounded-full bg-[#F2F2F7] items-center justify-center`}
              onPress={() => updateSetting(['reminderIntervalMinutes'], Math.min(180, settings.reminderIntervalMinutes + 15))}
            >
              <Ionicons name="add" size={24} color="#1E3D37" />
            </TouchableOpacity>
          </View>
          {/* Custom Visual Bar */}
          <View style={tw`h-[6px] bg-[#F2F2F7] rounded-[3px] overflow-hidden mt-4`}>
            <View style={[tw`h-full bg-[#1E3D37] rounded-[3px]`, { width: `${(settings.reminderIntervalMinutes / 180) * 100}%` }]} />
          </View>
          <Text style={tw`text-[13px] text-[#8E8E93] mt-3 text-center`}>推奨：60分間隔で起立して身体をリフレッシュ</Text>
        </View>

        {/* Daily goal */}
        <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>目標起立回数</Text>
        <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
          <View style={tw`flex-row items-center justify-between py-[10px]`}>
            <TouchableOpacity
              style={tw`w-12 h-12 rounded-full bg-[#F2F2F7] items-center justify-center`}
              onPress={() => updateSetting(['dailyStandGoal'], Math.max(1, settings.dailyStandGoal - 1))}
            >
              <Ionicons name="remove" size={24} color="#1E3D37" />
            </TouchableOpacity>
            <View style={tw`flex-row items-baseline`}>
              <Text style={tw`text-[32px] font-bold text-[#1E3D37]`}>{settings.dailyStandGoal}</Text>
              <Text style={tw`text-[16px] font-semibold text-[#7E8B93] ml-[6px]`}>回 / 日</Text>
            </View>
            <TouchableOpacity
              style={tw`w-12 h-12 rounded-full bg-[#F2F2F7] items-center justify-center`}
              onPress={() => updateSetting(['dailyStandGoal'], Math.min(24, settings.dailyStandGoal + 1))}
            >
              <Ionicons name="add" size={24} color="#1E3D37" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sensor Sensitivity */}
        <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>センサー感度設定</Text>
        <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
          <View style={tw`flex-row justify-between py-1`}>
            {['Low', 'Medium', 'High'].map((level) => {
              const labelMap = { Low: '低', Medium: '中', High: '高' };
              const isActive = settings.sensorSensitivity === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={tw`flex-1 py-3 rounded-[12px] items-center mx-1 ${isActive ? 'bg-[#EAF6F3] border border-[#1E3D37]' : 'bg-[#F2F2F7]'}`}
                  onPress={() => updateSetting(['sensorSensitivity'], level)}
                >
                  <Text style={tw`text-[15px] ${isActive ? 'text-[#1E3D37] font-bold' : 'text-[#8E8E93] font-medium'}`}>
                    {labelMap[level]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
