import React, { createContext, useContext, useState, useEffect } from 'react';

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
