import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import tw from 'twrnc';

const Stack = createNativeStackNavigator();

// -------------------------------------------------------------
// Centralized Settings Data Structure (Easy to map with API)
// -------------------------------------------------------------
const INITIAL_SETTINGS = {
  wifi: {
    enabled: false,
    connectedSsid: '',
    autoConnect: false,
    preferredSsid: '',
    delaySeconds: 5,
  },
  reminderIntervalMinutes: 60,
  dailyStandGoal: 8,
  sensorSensitivity: 'Medium', // 'Low' | 'Medium' | 'High'
  device: {
    name: process.env.EXPO_PUBLIC_DEFAULT_DEVICE_NAME || 'SG-Sensor-X1',
    status: 'Connected',
    batteryLevel: 82,
    serialNumber: 'SN-98231B-G',
    firmwareVersion: 'v' + (process.env.EXPO_PUBLIC_APP_VERSION || '1.2.4'),
  },
  notifications: {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    soundName: 'Chime',
    dndEnabled: false,
  },
  language: 'ja', // 'ja' | 'en' | 'zh' | 'ko'
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  // Mock API Operations
  // Future implementation: Fetch settings from API on mount
  const fetchSettingsFromApi = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.standupguardian.com';
      // const response = await fetch(`${apiUrl}/settings`);
      // const data = await response.json();
      // setSettings(data);
    } catch (error) {
      console.log('API Fetch Error:', error);
    }
  };

  // Future implementation: Push changes to API
  const saveSettingsToApi = async (updatedSettings) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.standupguardian.com';
      // await fetch(`${apiUrl}/settings`, {
      //   method: 'PUT',
      //   body: JSON.stringify(updatedSettings),
      //   headers: { 'Content-Type': 'application/json' }
      // });
    } catch (error) {
      console.log('API Save Error:', error);
    }
  };

  const updateSetting = (path, value) => {
    setSettings((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev)); // Deep copy helper
      
      // Traverse to nested field
      let current = newSettings;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;

      // Save changes to API in background
      saveSettingsToApi(newSettings);

      return newSettings;
    });
  };

  useEffect(() => {
    fetchSettingsFromApi();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// -------------------------------------------------------------
// Setting Main Screen (List of settings)
// -------------------------------------------------------------
function SettingMainScreen({ navigation }) {
  const { settings } = useSettings();

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F7F9FB]`}>
      <View style={tw`px-6 pb-3 bg-[#F7F9FB] ${Platform.OS === 'android' ? 'pt-4' : 'pt-3'}`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`relative justify-center items-center mr-[10px]`}>
            <Ionicons name="shield" size={36} color="#7E8B93" />
            <View style={tw`absolute top-0 left-0 right-0 bottom-0 justify-center items-center pb-[2px]`}>
              <Text style={tw`text-white text-[11px] font-bold`}>SG</Text>
            </View>
          </View>
          <Text style={tw`text-[26px] font-bold text-black tracking-tighter`}>StandUpGuardian</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={tw`px-5 pb-10`} showsVerticalScrollIndicator={false}>
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
    </SafeAreaView>
  );
}

// -------------------------------------------------------------
// Back Button Component for Detail Screens
// -------------------------------------------------------------
function DetailHeader({ title, onBack }) {
  return (
    <View style={tw`flex-row items-center justify-between px-4 py-3 bg-[#F7F9FB]`}>
      <TouchableOpacity 
        style={tw`w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm`} 
        onPress={onBack} 
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={tw`text-xl font-bold text-black`}>{title}</Text>
      <View style={tw`w-10`} />
    </View>
  );
}

// -------------------------------------------------------------
// 1. Wifi Setting Screen (with integrated Auto Connect settings)
// -------------------------------------------------------------
function WifiSettingScreen({ navigation }) {
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
                    起動時に既知のネットワークへ自動接続
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

// -------------------------------------------------------------
// 3. Details (Advanced) Screen
// -------------------------------------------------------------
function DetailsScreen({ navigation }) {
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

// -------------------------------------------------------------
// 4. Device Management Screen
// -------------------------------------------------------------
function DeviceMgmtScreen({ navigation }) {
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

// -------------------------------------------------------------
// 5. Notifications Customization Screen
// -------------------------------------------------------------
function NotificationsScreen({ navigation }) {
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

// -------------------------------------------------------------
// 6. Language Screen
// -------------------------------------------------------------
function LanguageScreen({ navigation }) {
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

// -------------------------------------------------------------
// Export Stack Navigator with Settings Provider
// -------------------------------------------------------------
export default function Setting() {
  return (
    <SettingsProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="SettingMain" component={SettingMainScreen} />
          <Stack.Screen name="WifiSetting" component={WifiSettingScreen} />
          <Stack.Screen name="Details" component={DetailsScreen} />
          <Stack.Screen name="DeviceMgmt" component={DeviceMgmtScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SettingsProvider>
  );
}
