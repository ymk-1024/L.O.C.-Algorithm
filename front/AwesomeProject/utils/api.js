import { Platform, NativeModules } from 'react-native';

/**
 * Resolves the API URL based on environment variables or dynamic IP detection.
 */
export const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!envUrl || envUrl.includes('api.standupguardian.com')) {
    return 'https://loc.mattya3340.com/api/v1.0';
  }
  if (envUrl.endsWith('/v1.0')) return envUrl;
  if (envUrl.endsWith('/api')) return `${envUrl}/v1.0`;
  return `${envUrl}/api/v1.0`;
};

/**
 * ユーザー設定をサーバーから取得する
 */
export const fetchUserSettings = async (userUuid) => {
  try {
    const res = await fetch(`${getApiUrl()}/users/${userUuid}/settings`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch (e) {
    console.warn('[API] fetchUserSettings error:', e.message);
    return null;
  }
};

/**
 * ユーザー設定をサーバーに保存する（デバウンスして呼ぶこと）
 */
export const saveUserSettings = async (userUuid, { reminderIntervalMinutes, dailyStandGoal, sensorSensitivity }) => {
  try {
    const res = await fetch(`${getApiUrl()}/users/${userUuid}/settings`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderIntervalMinutes, dailyStandGoal, sensorSensitivity }),
    });
    if (!res.ok) console.warn('[API] saveUserSettings failed:', res.status);
  } catch (e) {
    console.warn('[API] saveUserSettings error:', e.message);
  }
};

