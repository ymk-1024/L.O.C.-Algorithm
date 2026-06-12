import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './SettingsContext';
import DetailHeader from './DetailHeader';
import { bleManager } from '../utils/bleManager';

export default function DeviceMgmtScreen({ navigation }) {
  const { settings } = useSettings();

  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [isVirtualMode, setIsVirtualMode] = useState(false);

  // Sync virtual/physical state on mount
  useEffect(() => {
    const state = bleManager.getConnectionState();
    setIsVirtualMode(state.isVirtual);
  }, []);


  const handleUnpair = () => {
    Alert.alert(
      'デバイスのペアリング解除',
      `現在接続されているセンサー「${settings.device.name}」の接続を解除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '解除する', 
          style: 'destructive', 
          onPress: async () => {
            await bleManager.disconnect();
            Alert.alert('ペアリング解除完了', 'デバイスの接続を解除しました。');
          } 
        },
      ]
    );
  };

  const startScan = async () => {
    setDiscoveredDevices([]);
    setIsScanning(true);
    
    try {
      await bleManager.startScan(
        (device) => {
          setDiscoveredDevices((prev) => {
            if (prev.some((d) => d.id === device.id)) return prev;
            return [...prev, device];
          });
        },
        (error) => {
          Alert.alert('スキャン失敗', `Bluetoothスキャンエラー: ${error.message}`);
          setIsScanning(false);
        }
      );
    } catch (e) {
      Alert.alert('スキャンエラー', e.message);
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    bleManager.stopScan();
    setIsScanning(false);
  };

  const connectToDevice = async (device) => {
    stopScan();
    try {
      Alert.alert('デバイス接続', `${device.name} に接続します...`);
      await bleManager.connectToDevice(device.id, device.rawDevice);
      Alert.alert('接続成功', `${device.name} とペアリングしました。`);
    } catch (error) {
      Alert.alert('接続失敗', `ペアリングに失敗しました: ${error.message}`);
    }
  };

  const isConnected = settings.device.status === 'Connected';

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F7F9FB]`}>
      <DetailHeader title="デバイス管理" onBack={() => { stopScan(); navigation.goBack(); }} />
      <ScrollView contentContainerStyle={tw`px-5 pb-10`}>
        
        {/* Connection Mode Ribbon Banner */}
        <View style={tw`mb-4 py-2 px-3 rounded-lg ${isVirtualMode ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
          <Text style={tw`text-center text-[12px] font-semibold ${isVirtualMode ? 'text-amber-700' : 'text-emerald-700'}`}>
            {isVirtualMode 
              ? '⚠️ 仮想BLEモード動作中 (シミュレーション)' 
              : '⚡ 実機Bluetooth LE (react-native-ble-plx) 動作中'}
          </Text>
        </View>

        {isConnected ? (
          /* Paired Device Status View */
          <View>
            <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
              <View style={tw`flex-row items-center pb-1`}>
                <Ionicons name="hardware-chip-outline" size={40} color="#1E3D37" />
                <View style={{ marginLeft: 16 }}>
                  <Text style={tw`text-[20px] font-bold text-[#1C1C1E]`}>{settings.device.name}</Text>
                  <Text style={tw`text-[14px] text-[#27AE60] font-semibold mt-[2px]`}>ペアリング済み (接続中)</Text>
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


            <TouchableOpacity style={tw`bg-white rounded-[16px] py-4 items-center border border-[#EB5757] mb-5`} onPress={handleUnpair}>
              <Text style={tw`text-[#EB5757] text-[16px] font-bold`}>ペアリングの解除</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Disconnected Scan/Pairing UI */
          <View>
            <View style={tw`bg-white rounded-[20px] p-6 mb-5 items-center shadow-sm`}>
              <Ionicons name="bluetooth-outline" size={60} color="#8E8E93" style={tw`mb-3`} />
              <Text style={tw`text-[20px] font-bold text-[#1C1C1E]`}>デバイス未接続</Text>
              <Text style={tw`text-[14px] text-[#8E8E93] text-center mt-2 px-4 leading-5`}>
                センサーが接続されていません。LOCの自動計測を開始するには、センサーをペアリングしてください。
              </Text>
            </View>

            {isScanning ? (
              <View>
                <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm items-center`}>
                  <ActivityIndicator size="large" color="#1E3D37" />
                  <Text style={tw`text-[14px] text-[#1E3D37] font-semibold mt-3`}>近くのセンサーデバイスをスキャン中...</Text>
                  <TouchableOpacity style={tw`mt-4 bg-[#F2F2F7] px-4 py-2 rounded-[10px]`} onPress={stopScan}>
                    <Text style={tw`text-[#EB5757] text-[13px] font-bold`}>スキャンを停止</Text>
                  </TouchableOpacity>
                </View>

                {discoveredDevices.length > 0 && (
                  <View>
                    <Text style={tw`text-[15px] font-bold text-[#7E8B93] mb-2 ml-2`}>発見されたデバイス</Text>
                    <View style={tw`bg-white rounded-[20px] p-4 mb-5 shadow-sm`}>
                      {discoveredDevices.map((device, index) => {
                        const isLast = index === discoveredDevices.length - 1;
                        return (
                          <TouchableOpacity
                            key={device.id}
                            style={tw`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-[#F2F2F7]' : ''}`}
                            onPress={() => connectToDevice(device)}
                          >
                            <View style={tw`flex-row items-center`}>
                              <Ionicons name="hardware-chip-outline" size={24} color="#1E3D37" />
                              <View style={tw`ml-3`}>
                                <Text style={tw`text-[16px] font-bold text-[#1C1C1E]`}>{device.name}</Text>
                                <Text style={tw`text-[12px] text-[#8E8E93] mt-[2px]`}>ID: {device.id}</Text>
                              </View>
                            </View>
                            <View style={tw`flex-row items-center`}>
                              <Text style={tw`text-[12px] text-[#8E8E93] mr-2`}>RSSI: {device.rssi}</Text>
                              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={tw`bg-[#1E3D37] rounded-[16px] py-4 items-center mb-5`}
                onPress={startScan}
              >
                <Text style={tw`text-white text-[16px] font-bold`}>新しいデバイスとペアリング</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
