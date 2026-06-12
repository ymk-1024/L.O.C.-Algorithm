import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';


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

  // API Operations
  const fetchSettingsFromApi = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/settings`);
      if (response.ok) {
        const resJson = await response.json();
        // Support both { status: 200, data: { ... } } wrapper and raw settings objects
        const data = (resJson && resJson.data) ? resJson.data : resJson;
        
        if (data && typeof data === 'object') {
          // Merge fetched settings with initial structure to prevent missing properties
          setSettings((prev) => ({
            ...prev,
            ...data,
            wifi: { ...prev.wifi, ...(data.wifi || {}) },
            device: { ...prev.device, ...(data.device || {}) },
            notifications: { ...prev.notifications, ...(data.notifications || {}) }
          }));
        }
      } else {
        console.log('API Fetch failed with status:', response.status);
      }
    } catch (error) {
      console.log('API Fetch Error (using local settings):', error);
    }
  };

  const saveSettingsToApi = async (updatedSettings) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/settings`, {
        method: 'PUT',
        body: JSON.stringify(updatedSettings),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        console.log('API Save failed with status:', response.status);
      }
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
