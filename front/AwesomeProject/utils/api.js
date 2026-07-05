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
    return 'https://loc.mattya3340.com/api/v1.0';
  }
  
  if (envUrl.endsWith('/v1.0')) {
    return envUrl;
  }
  if (envUrl.endsWith('/api')) {
    return `${envUrl}/v1.0`;
  }
  return `${envUrl}/api/v1.0`;
};
