import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './setting/SettingsContext';
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';

export default function AccountScreen({ navigation }) {
  const { settings, updateSetting } = useSettings();

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'アカウントからログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', style: 'destructive', onPress: () => Alert.alert('ログアウト完了', 'ログアウトしました。') }
      ]
    );
  };

  const handleTerms = () => {
    Alert.alert('利用規約', '利用規約は現在準備中です。');
  };

  const handleAppInfo = () => {
    Alert.alert(
      'アプリ情報',
      `アプリ名: StandUpGuardian\nバージョン: ${settings.device.firmwareVersion || 'v1.0.0'}\n開発元: Google DeepMind pair-coding`
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F7F9FB]`}>
      {/* 共通ヘッダー */}
      <AppHeader />

      <ScrollView contentContainerStyle={tw`px-5 pb-24`} showsVerticalScrollIndicator={false}>
        {/* メインのコンテナカード */}
        <View style={tw`bg-white rounded-[24px] p-5 mt-[10px] shadow-sm`}>
          {/* 「アカウント」ヘッダー帯 */}
          <View style={tw`bg-[#EAF6F3] rounded-[16px] py-[14px] px-5 mb-6`}>
            <Text style={tw`text-[28px] font-bold text-[#1E3D37]`}>アカウント</Text>
          </View>

          {/* ユーザープロフィールエリア */}
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-[100px] h-[100px] rounded-full bg-[#E2E8F0] items-center justify-center mb-3 border-4 borderColor-white shadow-sm`}>
              <Ionicons name="person" size={60} color="#7E8B93" />
            </View>
            <Text style={tw`text-[24px] font-bold text-[#1C1C1E]`}>中木 優子</Text>
            <Text style={tw`text-[15px] text-[#7E8B93] mt-1`}>sone-name@gmail.com</Text>
          </View>

          <View style={tw`h-[1px] bg-[#EAEAEA] mb-2`} />

          {/* メニューリスト */}
          {/* 1. 通知設定 */}
          <View style={tw`flex-row items-center justify-between py-[18px] px-3 border-b border-[#EAEAEA]`}>
            <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>通知設定</Text>
            <Switch
              value={settings.notifications.enabled}
              onValueChange={(val) => updateSetting(['notifications', 'enabled'], val)}
              trackColor={{ false: '#D1D1D6', true: '#EAF6F3' }}
              thumbColor={settings.notifications.enabled ? '#1E3D37' : '#FFFFFF'}
            />
          </View>

          {/* 2. ログアウト */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-between py-[18px] px-3 border-b border-[#EAEAEA]`}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>ログアウト</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>

          {/* 3. 利用規約 */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-between py-[18px] px-3 border-b border-[#EAEAEA]`}
            activeOpacity={0.7}
            onPress={handleTerms}
          >
            <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>利用規約</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>

          {/* 4. アプリ情報 */}
          <TouchableOpacity
            style={tw`flex-row items-center justify-between py-[18px] px-3 border-b-0`}
            activeOpacity={0.7}
            onPress={handleAppInfo}
          >
            <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>アプリ情報</Text>
            <Ionicons name="chevron-forward" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 最下部の共通ボトムメニューバー */}
      <BottomMenuBar activeTab="Account" navigation={navigation} />
    </SafeAreaView>
  );
}
