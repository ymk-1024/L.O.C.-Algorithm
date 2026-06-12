import React, { createContext, useContext, useState, useEffect } from 'react';
import { bleManager } from '../utils/bleManager';

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
      const newSettings = JSON.parse(JSON.stringify(prev)); // Deep copy helper
      
      // Traverse to nested field
      let current = newSettings;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;

      // Sync updated configuration to BLE hardware
      syncSettingsToDevice(newSettings);

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
