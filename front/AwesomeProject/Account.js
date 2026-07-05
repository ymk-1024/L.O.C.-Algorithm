import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { getApiUrl } from './utils/api';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useSettings } from './setting/SettingsContext';
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';

export default function AccountScreen({ navigation }) {
  const { settings, updateSetting } = useSettings();
  const [userInfo, setUserInfo] = useState({
    username: '未ログイン',
    email: '-',
  });
  const [debugInfo, setDebugInfo] = useState({
    url: '',
    error: null,
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      let resolvedUrl = '';
      try {
        const apiUrl = getApiUrl();
        // /auth/me を叩いてログイン状態を確認する
        resolvedUrl = `${apiUrl}/auth/me`;
        setDebugInfo(prev => ({ ...prev, url: resolvedUrl }));

        const response = await fetch(resolvedUrl);
        if (response.ok) {
          const resData = await response.json();
          if (resData && resData.status === 200 && resData.data?.user_uuid) {
            setIsLoggedIn(true);
            const uuid = resData.data.user_uuid;
            setUserInfo(prev => ({ ...prev, uuid: uuid }));
            
            // Fetch real user info
            try {
              const userRes = await fetch(`${apiUrl}/users/${uuid}`);
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.status === 200 && userData.data) {
                  setUserInfo({
                    uuid: uuid,
                    username: userData.data.username || '名無し',
                    email: userData.data.email || 'Email未設定',
                  });
                }
              }
            } catch (e) {
              console.log('Failed to fetch user details', e);
            }
            setDebugInfo(prev => ({ ...prev, error: null }));
          } else {
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.log('Account Auth Check Error:', error);
        setDebugInfo(prev => ({ ...prev, url: resolvedUrl, error: error.message }));
      }
    };

    fetchUserInfo();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserInfo();
    });

    return unsubscribe;
  }, [navigation]);

  const handleLoginSubmit = async () => {
    if (!identifier || !password) {
      Alert.alert('エラー', 'IDとパスワードを入力してください。');
      return;
    }
    setIsLoggingIn(true);
    try {
      const apiUrl = getApiUrl();
      // 1. ログインしてCookie(access_token)を取得
      let loginRes = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      if (!loginRes.ok) {
        const errData = await loginRes.json();
        throw new Error(errData.message || 'ログインに失敗しました');
      }

      const loginData = await loginRes.json();
      const accessToken = loginData.data?.accessToken;

      // 2. OwnerTokenを発行申請
      const issueRes = await fetch(`${apiUrl}/device/issue-token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify({ 
          deviceUuid: settings.device.serialNumber || 'SN-UNKNOWN',
          name: settings.device.name || 'SG-Sensor-X1'
        })
      });

      const issueData = await issueRes.json();
      if (!issueRes.ok || issueData.status !== 201) {
        throw new Error(issueData.message || 'トークン発行に失敗しました');
      }

      // 3. トークンをContextに保存＆BLEでデバイスへ転送
      const token = issueData.data.ownerToken;
      updateSetting(['device', 'token'], token);

      setIsLoggedIn(true);
      setUserInfo({
        username: '認証済みユーザー',
        email: 'ID: ' + identifier,
      });
      setLoginModalVisible(false);
      Alert.alert('連携完了', 'サーバーからOwnerTokenを取得し、デバイスに書き込みました！');
    } catch (error) {
      Alert.alert('エラー', error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!identifier || !password) {
      Alert.alert('エラー', 'IDとパスワードを入力してください。');
      return;
    }
    setIsLoggingIn(true);
    try {
      const apiUrl = getApiUrl();
      const registerRes = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: identifier, 
          password: password, 
          email: `${identifier}@example.com` 
        })
      });

      if (!registerRes.ok) {
        const errData = await registerRes.json();
        throw new Error(errData.message || '新規登録に失敗しました（既に存在する可能性があります）');
      }

      // 登録成功したらそのままログイン処理へ流す
      await handleLoginSubmit();
    } catch (error) {
      Alert.alert('登録エラー', error.message);
      setIsLoggingIn(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert('エラー', 'ユーザー名を入力してください。');
      return;
    }
    if (!userInfo.uuid) return;
    
    setIsUpdating(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/${userInfo.uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      });
      
      if (res.ok) {
        setUserInfo(prev => ({ ...prev, username: newUsername }));
        setEditModalVisible(false);
        Alert.alert('完了', 'ユーザー名を更新しました！');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || '更新に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    if (!isLoggedIn) return;
    Alert.alert(
      'ログアウト',
      'アカウントからログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'ログアウト', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await fetch(`${getApiUrl()}/auth/logout`, { method: 'POST' });
              setIsLoggedIn(false);
              setUserInfo({ username: '未ログイン', email: '-' });
              Alert.alert('ログアウト完了', 'ログアウトしました。');
            } catch (e) {
              console.warn(e);
            }
          }
        }
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

      <ScrollView contentContainerStyle={tw`px-5 pb-24`} showsVerticalScrollIndicator={false} scrollEnabled={false}>
        {/* メインのコンテナカード */}
        <View style={tw`bg-white rounded-[24px] p-5 mt-[14px] shadow-sm`}>
          {/* 「アカウント」ヘッダー帯 */}
          <View style={tw`bg-[#EAF6F3] rounded-[16px] py-[10.5px] px-5 mb-6`}>
            <Text style={tw`text-[28px] font-bold text-[#1E3D37]`}>アカウント</Text>
          </View>

          {/* ユーザープロフィールエリア */}
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-[100px] h-[100px] rounded-full bg-[#E2E8F0] items-center justify-center mb-3 border-4 borderColor-white shadow-sm`}>
              <Ionicons name="person" size={60} color="#7E8B93" />
            </View>
            <View style={tw`flex-row items-center justify-center`}>
              <Text style={tw`text-[24px] font-bold text-[#1C1C1E] mr-2`}>{userInfo.username}</Text>
              {isLoggedIn && (
                <TouchableOpacity onPress={() => {
                  setNewUsername(userInfo.username);
                  setEditModalVisible(true);
                }}>
                  <Ionicons name="pencil-outline" size={20} color="#1E3D37" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={tw`text-[15px] text-[#7E8B93] mt-1`}>{userInfo.email}</Text>
            {/* Debug information overlay */}
            {__DEV__ && debugInfo.error && (
              <View style={tw`mt-3 p-2 bg-red-50 border border-red-200 rounded-lg w-full`}>
                <Text style={tw`text-red-600 text-[11px] text-center`}>API Error: {debugInfo.error}</Text>
                <Text style={tw`text-gray-500 text-[9px] text-center mt-1`}>URL: {debugInfo.url}</Text>
              </View>
            )}

            {!isLoggedIn && (
              <TouchableOpacity
                style={tw`mt-4 bg-[#1E3D37] px-6 py-3 rounded-full shadow-sm`}
                onPress={() => setLoginModalVisible(true)}
              >
                <Text style={tw`text-white font-bold text-[15px]`}>サーバーにログインして連携</Text>
              </TouchableOpacity>
            )}
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

      {/* Login Modal */}
      <Modal visible={loginModalVisible} transparent={true} animationType="fade">
        <View style={tw`flex-1 bg-black/50 justify-center items-center px-5`}>
          <View style={tw`bg-white rounded-[24px] w-full p-6 shadow-lg`}>
            <Text style={tw`text-[22px] font-bold text-[#1E3D37] mb-2 text-center`}>ログイン</Text>
            <Text style={tw`text-[13px] text-[#7E8B93] mb-6 text-center`}>サーバーからOwnerTokenを発行し、デバイスを所有者と紐付けます。</Text>
            
            <Text style={tw`text-[14px] font-bold text-[#1C1C1E] mb-2 ml-1`}>ユーザーID (identifier)</Text>
            <TextInput
              style={tw`bg-[#F7F9FB] rounded-[12px] px-4 py-3 mb-4 text-[16px] text-[#1C1C1E] border border-[#EAEAEA]`}
              placeholder="ログインID"
              placeholderTextColor="#A0AEC0"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />

            <Text style={tw`text-[14px] font-bold text-[#1C1C1E] mb-2 ml-1`}>パスワード</Text>
            <TextInput
              style={tw`bg-[#F7F9FB] rounded-[12px] px-4 py-3 mb-6 text-[16px] text-[#1C1C1E] border border-[#EAEAEA]`}
              placeholder="パスワード"
              placeholderTextColor="#A0AEC0"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={tw`bg-[#1E3D37] rounded-[16px] py-4 items-center mb-3 flex-row justify-center`}
              onPress={handleLoginSubmit}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#FFFFFF" style={tw`mr-2`} />
              ) : null}
              <Text style={tw`text-white font-bold text-[16px]`}>ログインしてトークン取得</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-[#EAF6F3] rounded-[16px] py-4 items-center mb-3 flex-row justify-center`}
              onPress={handleRegisterSubmit}
              disabled={isLoggingIn}
            >
              <Text style={tw`text-[#1E3D37] font-bold text-[16px]`}>新規登録してトークン取得</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`py-3 items-center`}
              onPress={() => setLoginModalVisible(false)}
              disabled={isLoggingIn}
            >
              <Text style={tw`text-[#7E8B93] font-bold text-[15px]`}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Username Modal */}
      <Modal visible={editModalVisible} transparent={true} animationType="fade">
        <View style={tw`flex-1 bg-black/50 justify-center items-center px-5`}>
          <View style={tw`bg-white rounded-[24px] w-full p-6 shadow-lg`}>
            <Text style={tw`text-[22px] font-bold text-[#1E3D37] mb-2 text-center`}>ユーザー名の変更</Text>
            
            <Text style={tw`text-[14px] font-bold text-[#1C1C1E] mb-2 ml-1 mt-4`}>新しいユーザー名</Text>
            <TextInput
              style={tw`bg-[#F7F9FB] rounded-[12px] px-4 py-3 mb-6 text-[16px] text-[#1C1C1E] border border-[#EAEAEA]`}
              placeholder="新しいユーザー名を入力"
              placeholderTextColor="#A0AEC0"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={tw`bg-[#1E3D37] rounded-[16px] py-4 items-center mb-3 flex-row justify-center`}
              onPress={handleUpdateUsername}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#FFFFFF" style={tw`mr-2`} />
              ) : null}
              <Text style={tw`text-white font-bold text-[16px]`}>保存する</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`py-3 items-center`}
              onPress={() => setEditModalVisible(false)}
              disabled={isUpdating}
            >
              <Text style={tw`text-[#7E8B93] font-bold text-[15px]`}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 最下部の共通ボトムメニューバー */}
      <BottomMenuBar activeTab="Account" navigation={navigation} />
    </SafeAreaView>
  );
}
