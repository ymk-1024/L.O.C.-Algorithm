import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { bleManager } from '../utils/bleManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUserSettings, saveUserSettings, getApiUrl } from '../utils/api';

// -------------------------------------------------------------
// Centralized Settings Data Structure (Easy to map with API)
// -------------------------------------------------------------
const INITIAL_SETTINGS = {
  wifi: {
    enabled: false,
    connectedSsid: '',
    password: '',
    autoConnect: false,
    preferredSsid: '',
    delaySeconds: 5,
  },
  reminderIntervalMinutes: 60,
  dailyStandGoal: 8,
  sensorSensitivity: 'Medium', // 'Low' | 'Medium' | 'High'
  debugMode: false,
  device: {
    name: process.env.EXPO_PUBLIC_DEFAULT_DEVICE_NAME || 'SG-Sensor-X1',
    status: 'Disconnected',
    batteryLevel: 82,
    serialNumber: 'SN-98231B-G',
    firmwareVersion: 'v' + (process.env.EXPO_PUBLIC_APP_VERSION || '1.2.4'),
    token: '',
    registered: false,
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
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [userUuid, setUserUuid] = useState(null);
  const saveTimerRef = useRef(null);

  // ログイン状態の確認とuserUuid取得
  useEffect(() => {
    const resolveUser = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.user_uuid) setUserUuid(data.data.user_uuid);
        }
      } catch (e) {
        // 未ログイン or ネットワーク不可 - 無視してローカル設定のみ使用
      }
    };
    resolveUser();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem('@app_settings');
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setIsSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // AsyncStorage への永続化
  useEffect(() => {
    if (isSettingsLoaded) {
      AsyncStorage.setItem('@app_settings', JSON.stringify(settings)).catch(e => console.error('Failed to save settings', e));
    }
  }, [settings, isSettingsLoaded]);

  // ログイン済みユーザーのサーバー設定をロード（AsyncStorage より優先）
  useEffect(() => {
    if (!userUuid || !isSettingsLoaded) return;
    fetchUserSettings(userUuid).then((serverSettings) => {
      if (!serverSettings) return;
      setSettings((prev) => ({
        ...prev,
        reminderIntervalMinutes: serverSettings.reminderIntervalMinutes ?? prev.reminderIntervalMinutes,
        dailyStandGoal:          serverSettings.dailyStandGoal          ?? prev.dailyStandGoal,
        sensorSensitivity:       serverSettings.sensorSensitivity       ?? prev.sensorSensitivity,
      }));
      console.log('[API] User settings loaded from server:', serverSettings);
    });
  }, [userUuid, isSettingsLoaded]);

  // サーバーへの保存（1秒デバウンス）
  const syncToServer = (newSettings) => {
    if (!userUuid) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveUserSettings(userUuid, {
        reminderIntervalMinutes: newSettings.reminderIntervalMinutes,
        dailyStandGoal:          newSettings.dailyStandGoal,
        sensorSensitivity:       newSettings.sensorSensitivity,
      });
    }, 1000);
  };

  // Bluetooth BLE Operations
  const fetchSettingsFromDevice = async () => {
    try {
      console.log('[Bluetooth BLE] Reading settings from paired device...');
    } catch (error) {
      console.log('[Bluetooth BLE] Error reading settings:', error);
    }
  };

  const syncSettingsToDevice = async (updatedSettings) => {
    const bleState = bleManager.getConnectionState();
    if (!bleState.isConnected) {
      console.log('[Bluetooth BLE] Device not connected. Sync skipped.');
      return;
    }
    try {
      await bleManager.syncSettings(updatedSettings);
    } catch (error) {
      console.log('[Bluetooth BLE] Error synchronizing config:', error);
    }
  };

  const updateSetting = (path, value) => {
    setSettings((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev));
      let current = newSettings;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;

      // BLE ハードウェアへ同期
      syncSettingsToDevice(newSettings);
      // サーバーへ保存（デバウンス）
      syncToServer(newSettings);

      return newSettings;
    });
  };

  useEffect(() => {
    fetchSettingsFromDevice();

    // Subscribe to BLE connection state changes to dynamically update Context settings state
    const handleBleStateChange = (bleState) => {
      if (bleState.isConnected && bleState.device) {
        setSettings((prev) => ({
          ...prev,
          device: {
            ...prev.device,
            name: bleState.device.name,
            status: 'Connected',
            batteryLevel: bleState.device.batteryLevel,
            serialNumber: bleState.device.serialNumber,
            firmwareVersion: bleState.device.firmwareVersion,
          },
        }));
      } else {
        setSettings((prev) => ({
          ...prev,
          device: {
            ...prev.device,
            status: 'Disconnected',
          },
        }));
      }
    };

    bleManager.addListener(handleBleStateChange);
    return () => {
      bleManager.removeListener(handleBleStateChange);
    };
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
