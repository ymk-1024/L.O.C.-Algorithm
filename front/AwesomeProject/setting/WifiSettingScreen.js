import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, ActivityIndicator, Modal, TextInput, Platform, PermissionsAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './SettingsContext';
import DetailHeader from './DetailHeader';
import { bleManager, addKnownSsid, getKnownSsids } from '../utils/bleManager';

export default function WifiSettingScreen({ navigation }) {
  const { settings, updateSetting } = useSettings();

  const [networks, setNetworks] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnectedDevice, setIsConnectedDevice] = useState(false);
  
  // Custom manual Wi-Fi input states
  const [showAddModal, setShowAddModal] = useState(false);
  const [customSsid, setCustomSsid] = useState('');
  const [customPassword, setCustomPassword] = useState('');

  useEffect(() => {
    const checkConnection = (bleState) => {
      setIsConnectedDevice(bleState.isConnected);
    };
    bleManager.addListener(checkConnection);
    return () => {
      bleManager.removeListener(checkConnection);
    };
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: '位置情報アクセスの許可',
          message: '周辺のWi-Fiネットワークを検索するために位置情報の許可が必要です。',
          buttonNeutral: '後で',
          buttonNegative: '拒否',
          buttonPositive: '許可',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const triggerWifiScan = async () => {
    const state = bleManager.getConnectionState();
    if (!state.isConnected) {
      return;
    }

    if (Platform.OS === 'android') {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('権限エラー', '位置情報の権限が拒否されたため、Wi-Fiスキャンを実行できません。');
        return;
      }
    }
    
    setIsScanning(true);
    setNetworks([]);
    try {
      const scanResult = await bleManager.scanWifi();
      setNetworks(scanResult);
    } catch (error) {
      console.warn('[Wi-Fi Scan Error]', error);
      Alert.alert('スキャン失敗', `Wi-Fiスキャンに失敗しました: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (settings.wifi.enabled && isConnectedDevice) {
      triggerWifiScan();
    } else {
      setNetworks([]);
    }
  }, [settings.wifi.enabled, isConnectedDevice]);

  const getSavedNetworksList = () => {
    const list = [];
    getKnownSsids().forEach((ssid) => {
      if (ssid && !list.includes(ssid)) {
        list.push(ssid);
      }
    });
    if (settings.wifi.connectedSsid && !list.includes(settings.wifi.connectedSsid)) {
      list.push(settings.wifi.connectedSsid);
    }
    networks.forEach((net) => {
      if (net.ssid && !list.includes(net.ssid)) {
        list.push(net.ssid);
      }
    });
    return list;
  };
  const savedNetworks = getSavedNetworksList();
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

  const handleConnectCustom = async () => {
    if (!customSsid) {
      Alert.alert('入力エラー', 'SSIDを入力してください。');
      return;
    }
    
    // Register the custom SSID to bleManager's dynamic scan results list
    addKnownSsid(customSsid);
    
    // Update Context settings state
    updateSetting(['wifi', 'connectedSsid'], customSsid);
    
    // Perform BLE sync including custom password
    const state = bleManager.getConnectionState();
    if (state.isConnected) {
      const syncPayload = {
        ...settings,
        wifi: {
          ...settings.wifi,
          connectedSsid: customSsid,
          password: customPassword || '', // Inject password for sync test
        }
      };
      
      try {
        await bleManager.syncSettings(syncPayload);
        Alert.alert('送信成功', `Wi-Fi設定（SSID: ${customSsid}）をデバイスに流し込みました。`);
      } catch (e) {
        console.warn('[Custom Wifi Sync Error]', e);
        Alert.alert('送信失敗', `設定の流し込みに失敗しました: ${e.message}`);
      }
    }
    
    setShowAddModal(false);
    setCustomSsid('');
    setCustomPassword('');
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
            <View style={tw`flex-row items-center justify-between mb-2 ml-2 mr-1`}>
              <Text style={tw`text-[16px] font-bold text-[#7E8B93]`}>利用可能なネットワーク</Text>
              {settings.wifi.enabled && isConnectedDevice && !isScanning && (
                <TouchableOpacity onPress={triggerWifiScan}>
                  <Ionicons name="refresh" size={18} color="#1E3D37" />
                </TouchableOpacity>
              )}
            </View>

            <View style={tw`bg-white rounded-[20px] p-5 mb-4 shadow-sm`}>
              {!isConnectedDevice ? (
                <View style={tw`items-center py-4`}>
                  <Ionicons name="bluetooth-outline" size={30} color="#8E8E93" style={tw`mb-2`} />
                  <Text style={tw`text-[14px] text-[#8E8E93] text-center px-4 leading-5`}>
                    Wi-Fiスキャンを実行するには、まず「デバイス管理」でセンサーに接続してください。
                  </Text>
                </View>
              ) : isScanning ? (
                <View style={tw`items-center py-6`}>
                  <ActivityIndicator size="small" color="#1E3D37" />
                  <Text style={tw`text-[13px] text-[#1E3D37] mt-2 font-medium`}>周辺のWi-Fiを検索中...</Text>
                </View>
              ) : networks.length === 0 ? (
                <View style={tw`items-center py-4`}>
                  <Text style={tw`text-[14px] text-[#8E8E93] mb-3`}>ネットワークが見つかりませんでした。</Text>
                  <TouchableOpacity style={tw`bg-[#1E3D37] px-4 py-2 rounded-[10px]`} onPress={triggerWifiScan}>
                    <Text style={tw`text-white text-[12px] font-bold`}>再スキャン</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                networks.map((net, index) => {
                  const isLast = index === networks.length - 1;
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
                })
              )}

              {isConnectedDevice && !isScanning && (
                <TouchableOpacity
                  style={tw`flex-row items-center justify-center py-4 border-t border-[#F2F2F7] mt-2`}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#1E3D37" />
                  <Text style={tw`text-[#1E3D37] text-[15px] font-bold ml-2`}>その他のネットワークを追加...</Text>
                </TouchableOpacity>
              )}
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
                  {savedNetworks.length === 0 ? (
                    <Text style={tw`text-[13px] text-[#8E8E93] py-2 leading-5`}>
                      接続履歴またはスキャンされたネットワークがありません。先にスキャンや手動追加を行ってください。
                    </Text>
                  ) : (
                    savedNetworks.map((net, index) => {
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
                    })
                  )}

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

      {/* Manual Wifi Add Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black/50 px-6`}>
          <View style={tw`bg-white rounded-[24px] w-full p-6 shadow-xl`}>
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <Text style={tw`text-[20px] font-bold text-[#1C1C1E]`}>ネットワークを手動追加</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={tw`text-[14px] font-bold text-[#7E8B93] mb-2`}>ネットワーク名 (SSID)</Text>
            <TextInput
              style={tw`bg-[#F2F2F7] rounded-[12px] p-3 text-[16px] mb-4 text-[#1C1C1E]`}
              placeholder="SSIDを入力してください"
              placeholderTextColor="#8E8E93"
              value={customSsid}
              onChangeText={setCustomSsid}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={tw`text-[14px] font-bold text-[#7E8B93] mb-2`}>パスワード</Text>
            <TextInput
              style={tw`bg-[#F2F2F7] rounded-[12px] p-3 text-[16px] mb-6 text-[#1C1C1E]`}
              placeholder="パスワードを入力してください"
              placeholderTextColor="#8E8E93"
              secureTextEntry={true}
              value={customPassword}
              onChangeText={setCustomPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#F2F2F7] py-3 rounded-[14px] mr-2 items-center`}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={tw`text-[#8E8E93] text-[15px] font-bold`}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-[#1E3D37] py-3 rounded-[14px] ml-2 items-center`}
                onPress={handleConnectCustom}
              >
                <Text style={tw`text-white text-[15px] font-bold`}>接続・流し込み</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
