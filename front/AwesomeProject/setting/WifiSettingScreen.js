import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './SettingsContext';
import DetailHeader from './DetailHeader';

export default function WifiSettingScreen({ navigation }) {
  const { settings, updateSetting } = useSettings();

  const availableNetworks = [
    { ssid: 'Office-Guest-Wi-Fi', secure: true, signal: 3 },
    { ssid: 'Home-Router-2G', secure: true, signal: 2 },
    { ssid: 'Free-Public-WiFi', secure: false, signal: 4 },
  ];

  const savedNetworks = ['StandUpGuardian_5G', 'Office-Guest-Wi-Fi', 'Home-Router-2G'];
  const delays = [
    { value: 0, label: 'なし' },
    { value: 5, label: '5秒' },
    { value: 10, label: '10秒' },
    { value: 30, label: '30秒' },
  ];

  const handleConnect = (ssid) => {
    Alert.alert('ネットワーク接続', `${ssid} に接続しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '接続',
        onPress: () => {
          updateSetting(['wifi', 'connectedSsid'], ssid);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F7F9FB]`}>
      <DetailHeader title="Wi-Fi設定" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={tw`px-5 pb-10`}>
        {/* Wi-Fi Switch Card */}
        <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
          <View style={tw`flex-row items-center justify-between py-1`}>
            <View>
              <Text style={tw`text-[18px] font-bold text-[#1C1C1E]`}>Wi-Fi</Text>
              <Text style={tw`text-[13px] text-[#8E8E93] mt-1 max-w-[80%]`}>周辺のネットワークを検索します</Text>
            </View>
            <Switch
              value={settings.wifi.enabled}
              onValueChange={(val) => updateSetting(['wifi', 'enabled'], val)}
              trackColor={{ false: '#D1D1D6', true: '#EAF6F3' }}
              thumbColor={settings.wifi.enabled ? '#1E3D37' : '#FFFFFF'}
            />
          </View>
        </View>

        {settings.wifi.enabled && (
          <View style={tw`mt-2`}>
            {/* Connection Status Card */}
            <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>接続中のネットワーク</Text>
            <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
              <View style={tw`flex-row items-center justify-between py-1`}>
                <View style={tw`flex-row items-center`}>
                  {settings.wifi.connectedSsid ? (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={tw`text-[18px] font-bold text-[#1C1C1E]`}>{settings.wifi.connectedSsid}</Text>
                        <Text style={tw`text-[12px] text-[#27AE60] font-medium`}>接続済み (5GHz)</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Ionicons name="warning-outline" size={24} color="#8E8E93" />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={tw`text-[18px] font-bold text-[#8E8E93]`}>未接続</Text>
                        <Text style={tw`text-[12px] text-[#8E8E93] font-medium`}>ネットワークを選択してください</Text>
                      </View>
                    </>
                  )}
                </View>
                <Ionicons name="wifi" size={20} color={settings.wifi.connectedSsid ? '#1E3D37' : '#8E8E93'} />
              </View>
            </View>

            {/* Available Networks Card */}
            <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>利用可能なネットワーク</Text>
            <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
              {availableNetworks.map((net, index) => {
                const isLast = index === availableNetworks.length - 1;
                return (
                  <TouchableOpacity
                    key={net.ssid}
                    style={tw`flex-row items-center justify-between py-[18px] ${!isLast ? 'border-b border-[#EAEAEA]' : ''}`}
                    onPress={() => handleConnect(net.ssid)}
                  >
                    <View style={tw`flex-row items-center`}>
                      <Ionicons
                        name={net.secure ? 'lock-closed-outline' : 'globe-outline'}
                        size={18}
                        color="#8E8E93"
                      />
                      <Text style={tw`text-[18px] text-[#1C1C1E] ml-[10px]`}>{net.ssid}</Text>
                    </View>
                    <View style={tw`justify-center`}>
                      <Ionicons name="wifi" size={18} color="#8E8E93" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Integrated Auto-Connect Settings Card */}
            <Text style={tw`text-[16px] font-bold text-[#7E8B93] mb-2 ml-2`}>自動接続設定 (オプション)</Text>
            <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
              <View style={tw`flex-row items-center justify-between py-1`}>
                <View>
                  <Text style={tw`text-[17px] font-semibold text-[#1C1C1E]`}>自動接続を有効にする</Text>
                  <Text style={tw`text-[12px] text-[#8E8E93] mt-1 max-w-[85%]`}>
                    起動時に既知 network へ自動接続
                  </Text>
                </View>
                <Switch
                  value={settings.wifi.autoConnect}
                  onValueChange={(val) => updateSetting(['wifi', 'autoConnect'], val)}
                  trackColor={{ false: '#D1D1D6', true: '#EAF6F3' }}
                  thumbColor={settings.wifi.autoConnect ? '#1E3D37' : '#FFFFFF'}
                />
              </View>

              {settings.wifi.autoConnect && (
                <View style={tw`mt-4 pt-4 border-t border-[#F2F2F7]`}>
                  {/* Preferred Network Selector */}
                  <Text style={tw`text-[14px] font-bold text-[#7E8B93] mb-3`}>最優先接続ネットワーク</Text>
                  {savedNetworks.map((net, index) => {
                    const isLast = index === savedNetworks.length - 1;
                    return (
                      <TouchableOpacity
                        key={net}
                        style={tw`flex-row items-center justify-between py-3 ${!isLast ? 'border-b border-[#F2F2F7]' : ''}`}
                        onPress={() => updateSetting(['wifi', 'preferredSsid'], net)}
                      >
                        <Text style={tw`text-[16px] text-[#1C1C1E]`}>{net}</Text>
                        {settings.wifi.preferredSsid === net && (
                          <Ionicons name="checkmark" size={18} color="#1E3D37" />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {/* Delay selector */}
                  <Text style={tw`text-[14px] font-bold text-[#7E8B93] mt-4 mb-3`}>接続遅延設定</Text>
                  <View style={tw`flex-row justify-between py-1`}>
                    {delays.map((d) => (
                      <TouchableOpacity
                        key={d.value}
                        style={tw`py-2 px-3 rounded-[10px] min-w-[55px] items-center ${settings.wifi.delaySeconds === d.value ? 'bg-[#EAF6F3]' : 'bg-[#F2F2F7]'}`}
                        onPress={() => updateSetting(['wifi', 'delaySeconds'], d.value)}
                      >
                        <Text style={tw`text-[13px] font-medium ${settings.wifi.delaySeconds === d.value ? 'text-[#1E3D37] font-bold' : 'text-[#8E8E93]'}`}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
