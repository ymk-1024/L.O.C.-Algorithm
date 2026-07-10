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

        {/* Debug Mode */}
        <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>🛠 デバッグ</Text>
        <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm border border-amber-200`}>
          <TouchableOpacity
            style={tw`flex-row items-center justify-between py-1`}
            onPress={() => {
              const next = !settings.debugMode;
              updateSetting(['debugMode'], next);
              // デバッグON→リマインダー1分、OFF→60分に戻す
              updateSetting(['reminderIntervalMinutes'], next ? 1 : 60);
            }}
            activeOpacity={0.7}
          >
            <View>
              <Text style={tw`text-[17px] font-semibold text-[#1C1C1E]`}>デバッグモード</Text>
              <Text style={tw`text-[12px] text-amber-600 mt-1`}>
                {settings.debugMode
                  ? '⚠️ ON: リマインダー 1分間隔'
                  : 'OFF: 本番設定で動作中'}
              </Text>
            </View>
            <View style={[
              tw`w-[51px] h-[31px] rounded-full justify-center`,
              { backgroundColor: settings.debugMode ? '#F59E0B' : '#D1D1D6' }
            ]}>
              <View style={[
                tw`w-[27px] h-[27px] rounded-full bg-white shadow-sm`,
                { marginLeft: settings.debugMode ? 22 : 2 }
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
