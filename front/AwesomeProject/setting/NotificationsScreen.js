import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './SettingsContext';
import DetailHeader from './DetailHeader';

export default function NotificationsScreen({ navigation }) {
  const { settings, updateSetting } = useSettings();

  const sounds = [
    { id: 'Default', label: 'デフォルト' },
    { id: 'Chime', label: 'チャイム' },
    { id: 'Alert', label: 'アラート' },
    { id: 'Silent', label: 'サイレント' },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F7F9FB]`}>
      <DetailHeader title="通知のカスタマイズ" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={tw`px-5 pb-10`}>
        <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
          <View style={tw`flex-row items-center justify-between py-1`}>
            <View>
              <Text style={tw`text-[18px] font-bold text-[#1C1C1E]`}>プッシュ通知</Text>
              <Text style={tw`text-[13px] text-[#8E8E93] mt-1 max-w-[80%]`}>起立のタイミングでお知らせします</Text>
            </View>
            <Switch
              value={settings.notifications.enabled}
              onValueChange={(val) => updateSetting(['notifications', 'enabled'], val)}
              trackColor={{ false: '#D1D1D6', true: '#EAF6F3' }}
              thumbColor={settings.notifications.enabled ? '#1E3D37' : '#FFFFFF'}
            />
          </View>
        </View>

        {settings.notifications.enabled && (
          <View style={tw`mt-2`}>
            <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>通知方法</Text>
            <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
              <View style={tw`flex-row items-center justify-between py-1`}>
                <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>音声通知</Text>
                <Switch
                  value={settings.notifications.soundEnabled}
                  onValueChange={(val) => updateSetting(['notifications', 'soundEnabled'], val)}
                  trackColor={{ false: '#D1D1D6', true: '#EAF6F3' }}
                  thumbColor={settings.notifications.soundEnabled ? '#1E3D37' : '#FFFFFF'}
                />
              </View>
              <View style={tw`flex-row items-center justify-between py-1`}>
                <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>バイブレーション</Text>
                <Switch
                  value={settings.notifications.vibrationEnabled}
                  onValueChange={(val) => updateSetting(['notifications', 'vibrationEnabled'], val)}
                  trackColor={{ false: '#D1D1D6', true: '#EAF6F3' }}
                  thumbColor={settings.notifications.vibrationEnabled ? '#1E3D37' : '#FFFFFF'}
                />
              </View>
            </View>

            {settings.notifications.soundEnabled && (
              <>
                <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>通知音の選択</Text>
                <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
                  {sounds.map((s, index) => {
                    const isLast = index === sounds.length - 1;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={tw`flex-row items-center justify-between py-[18px] ${!isLast ? 'border-b border-[#EAEAEA]' : ''}`}
                        onPress={() => updateSetting(['notifications', 'soundName'], s.id)}
                      >
                        <Text style={tw`text-[18px] text-[#1C1C1E] ml-[10px]`}>{s.label}</Text>
                        {settings.notifications.soundName === s.id && (
                          <Ionicons name="checkmark" size={20} color="#1E3D37" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>時間外の除外設定</Text>
            <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
              <View style={tw`flex-row items-center justify-between py-1`}>
                <View>
                  <Text style={tw`text-[18px] font-bold text-[#1C1C1E]`}>睡眠中モード (DND)</Text>
                  <Text style={tw`text-[13px] text-[#8E8E93] mt-1 max-w-[80%]`}>22:00 〜 翌07:00 の通知をミュートします</Text>
                </View>
                <Switch
                  value={settings.notifications.dndEnabled}
                  onValueChange={(val) => updateSetting(['notifications', 'dndEnabled'], val)}
                  trackColor={{ false: '#D1D1D6', true: '#EAF6F3' }}
                  thumbColor={settings.notifications.dndEnabled ? '#1E3D37' : '#FFFFFF'}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
