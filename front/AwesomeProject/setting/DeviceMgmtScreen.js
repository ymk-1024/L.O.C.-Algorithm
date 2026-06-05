import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './SettingsContext';
import DetailHeader from './DetailHeader';

export default function DeviceMgmtScreen({ navigation }) {
  const { settings } = useSettings();
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleUpdate = () => {
    setCheckingUpdate(true);
    setTimeout(() => {
      setCheckingUpdate(false);
      Alert.alert('アップデート確認', `最新のファームウェア (${settings.device.firmwareVersion}) が適用されています。`);
    }, 1500);
  };

  const handleUnpair = () => {
    Alert.alert(
      'デバイスのペアリング解除',
      `現在接続されているセンサー「${settings.device.name}」の接続を解除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '解除する', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F7F9FB]`}>
      <DetailHeader title="デバイス管理" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={tw`px-5 pb-10`}>
        <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
          <View style={tw`flex-row items-center pb-1`}>
            <Ionicons name="hardware-chip-outline" size={40} color="#1E3D37" />
            <View style={{ marginLeft: 16 }}>
              <Text style={tw`text-[20px] font-bold text-[#1C1C1E]`}>{settings.device.name}</Text>
              <Text style={tw`text-[14px] text-[#27AE60] font-semibold mt-[2px]`}>{settings.device.status}</Text>
            </View>
          </View>

          <View style={tw`h-[1px] bg-[#EAEAEA] my-4`} />

          <View style={tw`flex-row justify-between py-3`}>
            <Text style={tw`text-[15px] text-[#8E8E93]`}>バッテリー残量</Text>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="battery-full" size={20} color="#27AE60" />
              <Text style={tw`text-[15px] text-[#27AE60] font-bold ml-1`}>{settings.device.batteryLevel}%</Text>
            </View>
          </View>

          <View style={tw`flex-row justify-between py-3`}>
            <Text style={tw`text-[15px] text-[#8E8E93]`}>シリアル番号</Text>
            <Text style={tw`text-[15px] text-[#1C1C1E] font-medium`}>{settings.device.serialNumber}</Text>
          </View>

          <View style={tw`flex-row justify-between py-3`}>
            <Text style={tw`text-[15px] text-[#8E8E93]`}>ファームウェアバージョン</Text>
            <Text style={tw`text-[15px] text-[#1C1C1E] font-medium`}>{settings.device.firmwareVersion} (最新)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={tw`bg-[#1E3D37] rounded-[16px] py-4 items-center mb-3`}
          onPress={handleUpdate}
          disabled={checkingUpdate}
        >
          <Text style={tw`text-white text-[16px] font-bold`}>
            {checkingUpdate ? '確認中...' : 'ファームウェアアップデートの確認'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={tw`bg-white rounded-[16px] py-4 items-center border border-[#EB5757] mb-5`} onPress={handleUnpair}>
          <Text style={tw`text-[#EB5757] text-[16px] font-bold`}>ペアリングの解除</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
