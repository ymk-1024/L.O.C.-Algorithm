import { Platform, NativeModules } from 'react-native';

/**
 * Resolves the API URL based on environment variables or dynamic IP detection.
 * Supports Web (using window.location.hostname), Android emulator (10.0.2.2),
 * and physical devices (using scriptURL from NativeModules).
 */
export const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // If no custom env URL is set or it is pointing to the production mockup domain
  if (!envUrl || envUrl.includes('api.standupguardian.com')) {
    let host = 'localhost';
    
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location) {
        host = window.location.hostname;
      }
    } else {
      const scriptURL = NativeModules.SourceCode?.scriptURL;
      if (scriptURL) {
        const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
        if (match) {
          host = match[1];
        }
      }
    }
    
    // Android fallback: use 127.0.0.1 so adb reverse works on physical devices (Bridgeless mode)
    if (host === 'localhost' && Platform.OS === 'android') {
      host = '127.0.0.1';
    }
    
    return `http://${host}:3005/api/v1.0`;
  }
  
  return envUrl.endsWith('/api/v1.0') ? envUrl : `${envUrl}/api/v1.0`;
};
