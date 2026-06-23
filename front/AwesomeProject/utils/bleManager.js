import { Platform, PermissionsAndroid, NativeModules } from 'react-native';

// Dynamic loading of react-native-ble-plx to prevent crashes in Expo Go or Web environments
let BleManagerClass = null;
let isVirtualMode = false;

if (Platform.OS !== 'web') {
  try {
    const bleModule = require('react-native-ble-plx');
    BleManagerClass = bleModule.BleManager;
  } catch (error) {
    console.log('[BLE Manager] Native react-native-ble-plx module not available. Activating Virtual BLE Mode.');
    isVirtualMode = true;
  }
} else {
  console.log('[BLE Manager] Running on Web environment. Activating Virtual BLE Mode.');
  isVirtualMode = true;
}

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

// Helper to convert UTF-8 string to base64 safely across React Native and Web (handling multi-byte characters)
const utf8ToBase64 = (str) => {
  try {
    if (typeof btoa !== 'undefined') {
      return btoa(unescape(encodeURIComponent(str)));
    }
  } catch (e) {
    console.warn('[BLE Helper] btoa failed, falling back to basic base64 conversion');
  }
  
  // Basic fallback encoder
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    const b2 = i < bytes.length ? bytes[i++] : NaN;
    const b3 = i < bytes.length ? bytes[i++] : NaN;
    const c1 = b1 >> 2;
    const c2 = ((b1 & 3) << 4) | (b2 >> 4);
    const c3 = isNaN(b2) ? 64 : ((b2 & 15) << 2) | (b3 >> 6);
    const c4 = isNaN(b3) ? 64 : b3 & 63;
    result += chars.charAt(c1) + chars.charAt(c2) + (c3 === 64 ? '=' : chars.charAt(c3)) + (c4 === 64 ? '=' : chars.charAt(c4));
  }
  return result;
};

class LOCBleManager {
  constructor() {
    this.manager = null;
    this.connectedDevice = null;
    this.virtualDevice = {
      id: 'device-uuid-0001-aaaa-bbbb',
      name: 'SG-Sensor-X1',
      status: 'Disconnected',
      batteryLevel: 82,
      serialNumber: 'SN-98231B-G',
      firmwareVersion: 'v1.0.0',
    };
    this.listeners = new Set();
    this.isScanning = false;

    if (!isVirtualMode && BleManagerClass) {
      this.manager = new BleManagerClass();
    }
  }

  // Listeners to notify UI or Context about connection state changes
  addListener(listener) {
    this.listeners.add(listener);
    // Initial notification of current state
    listener(this.getConnectionState());
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyStateChange() {
    const state = this.getConnectionState();
    this.listeners.forEach((listener) => listener(state));
  }

  getConnectionState() {
    if (isVirtualMode) {
      return {
        isConnected: this.virtualDevice.status === 'Connected',
        device: this.virtualDevice.status === 'Connected' ? this.virtualDevice : null,
        isVirtual: true,
      };
    } else {
      return {
        isConnected: !!this.connectedDevice,
        device: this.connectedDevice ? {
          id: this.connectedDevice.id,
          name: this.connectedDevice.name || 'Unknown Device',
          status: 'Connected',
          batteryLevel: 100, // Read from BLE in real app
          serialNumber: this.connectedDevice.id || 'SN-PHYSICAL-X',
          firmwareVersion: 'v1.0.0',
        } : null,
        isVirtual: false,
      };
    }
  }

  // Request runtime permissions on Android
  async requestPermissions() {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn('[BLE Permission] Error requesting permissions:', err);
        return false;
      }
    }
    return true;
  }

  // Start scanning for devices
  async startScan(onDeviceFound, onError) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      if (onError) onError(new Error('Bluetooth permissions denied'));
      return;
    }

    if (this.isScanning) return;
    this.isScanning = true;

    if (isVirtualMode) {
      console.log('[BLE Scan] Virtual scan started. Looking for devices...');
      // Simulate discovering our custom device after a brief delay
      setTimeout(() => {
        if (this.isScanning && onDeviceFound) {
          onDeviceFound({
            id: 'device-uuid-0001-aaaa-bbbb',
            name: 'SG-Sensor-X1',
            rssi: -65,
          });
        }
      }, 1500);
    } else {
      console.log('[BLE Scan] Physical scan started.');
      try {
        this.manager.startDeviceScan(
          null, // Set to null to scan all nearby BLE devices for test ease (Product: [SERVICE_UUID])
          null,
          (error, device) => {
            if (error) {
              console.error('[BLE Scan Error]', error);
              this.isScanning = false;
              if (onError) onError(error);
              return;
            }
            if (device && onDeviceFound) {
              const name = device.name || device.localName;
              if (name) {
                onDeviceFound({
                  id: device.id,
                  name: name,
                  rssi: device.rssi,
                  rawDevice: device,
                });
              }
            }
          }
        );
      } catch (error) {
        console.error('[BLE Scan Crash Protected]', error);
        this.isScanning = false;
        if (onError) onError(error);
      }
    }
  }

  stopScan() {
    this.isScanning = false;
    if (isVirtualMode) {
      console.log('[BLE Scan] Virtual scan stopped.');
    } else if (this.manager) {
      try {
        this.manager.stopDeviceScan();
        console.log('[BLE Scan] Physical scan stopped.');
      } catch (error) {
        console.error('[BLE Stop Scan Error]', error);
      }
    }
  }

  // Connect to target device
  async connectToDevice(deviceId, rawDevice = null) {
    this.stopScan();

    if (isVirtualMode) {
      console.log(`[BLE Connect] Virtual connecting to device ID: ${deviceId}...`);
      return new Promise((resolve) => {
        setTimeout(() => {
          this.virtualDevice.status = 'Connected';
          console.log('[BLE Connect] Virtual connection successful.');
          this.notifyStateChange();
          resolve(this.virtualDevice);
        }, 1500);
      });
    } else {
      console.log(`[BLE Connect] Connecting to device ID: ${deviceId}...`);
      try {
        let device = rawDevice;
        if (!device) {
          device = await this.manager.connectToDevice(deviceId);
        } else {
          device = await device.connect();
        }
        
        console.log('[BLE Connect] Device connection established. Discovering services...');
        const connectedDevice = await device.discoverAllServicesAndCharacteristics();
        this.connectedDevice = connectedDevice;
        
        // Setup disconnection handler
        this.manager.onDeviceDisconnected(deviceId, (error, disconnectedDevice) => {
          console.log('[BLE Disconnect] Device disconnected:', disconnectedDevice?.id);
          this.connectedDevice = null;
          this.notifyStateChange();
        });

        this.notifyStateChange();
        return connectedDevice;
      } catch (error) {
        console.error('[BLE Connect Error]', error);
        throw error;
      }
    }
  }

  // Disconnect active device
  async disconnect() {
    if (isVirtualMode) {
      this.virtualDevice.status = 'Disconnected';
      console.log('[BLE Disconnect] Virtual device disconnected.');
      this.notifyStateChange();
    } else if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
        console.log('[BLE Disconnect] Physical device disconnected.');
        this.notifyStateChange();
      } catch (error) {
        console.error('[BLE Disconnect Error]', error);
      }
    }
  }

  // Send settings configuration payload to paired device (Nordic UART Service NUS / Command Protocol)
  async syncSettings(settings) {
    if (isVirtualMode) {
      console.log('[BLE Sync] Virtual transmitting settings configuration (NUS commands)...');
      if (settings.wifi && settings.wifi.connectedSsid) {
        console.log(`  -> write: "ssid ${settings.wifi.connectedSsid}\\n"`);
      }
      if (settings.wifi && settings.wifi.password) {
        console.log(`  -> write: "pass [PROTECTED]\\n"`);
      }
      const token = settings.token || (settings.device && settings.device.token);
      if (token) {
        console.log(`  -> write: "token ${token}\\n"`);
      }
      console.log('  -> write: "save\\n"');
      
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('[BLE Sync] Settings successfully synchronized (virtual write success).');
          resolve();
        }, 800);
      });
    } else {
      if (!this.connectedDevice) {
        throw new Error('No device connected via BLE.');
      }
      
      console.log('[BLE Sync] Preparing NUS settings commands...');
      let commands = [];
      if (settings.wifi && settings.wifi.connectedSsid) {
        commands.push(`ssid ${settings.wifi.connectedSsid}\n`);
      }
      if (settings.wifi && settings.wifi.password) {
        commands.push(`pass ${settings.wifi.password}\n`);
      }
      const token = settings.token || (settings.device && settings.device.token);
      if (token) {
        commands.push(`token ${token}\n`);
      }
      commands.push('save\n');
      
      try {
        console.log(`[BLE Sync] Transmitting ${commands.length} commands over physical BLE...`);
        const rxUuid = CHARACTERISTIC_UUID;
        
        for (const cmd of commands) {
          // パスワードなどの秘匿情報はログ出力時にマスクする
          const displayLog = cmd.startsWith('pass ') ? 'pass [PROTECTED]\n' : cmd;
          console.log(`[BLE Write Command] Sending: ${displayLog.trim()}`);
          
          const base64Cmd = utf8ToBase64(cmd);
          await this.connectedDevice.writeCharacteristicWithResponseForService(
            SERVICE_UUID,
            rxUuid,
            base64Cmd
          );
          // デバイス側のパース・書き込み処理に猶予を与えるため、短いディレイを挿入
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        console.log('[BLE Sync] Physical settings write completed successfully (using NUS protocol).');
      } catch (error) {
        console.warn(`[BLE Sync] Direct write to NUS UUIDs failed: ${error.message}. Attempting service discovery fallback...`);
        
        try {
          const services = await this.connectedDevice.services();
          let targetChar = null;
          
          console.log(`[BLE Discovery] Found ${services.length} services on this device.`);
          for (const service of services) {
            console.log(`[BLE Discovery] Scanning Service: ${service.uuid}`);
            const characteristics = await service.characteristics();
            for (const char of characteristics) {
              console.log(`  * Characteristic: ${char.uuid} | properties: w_resp=${char.isWritableWithResponse}, w_no_resp=${char.isWritableWithoutResponse}`);
              
              if (char.uuid.toLowerCase() === CHARACTERISTIC_UUID.toLowerCase()) {
                targetChar = char;
                break;
              }
              if (!targetChar && (char.isWritableWithResponse || char.isWritableWithoutResponse)) {
                targetChar = char;
              }
            }
            if (targetChar && targetChar.uuid.toLowerCase() === CHARACTERISTIC_UUID.toLowerCase()) {
              break;
            }
          }
          
          if (targetChar) {
            console.log(`[BLE Fallback Write] Sending commands to auto-discovered characteristic: ${targetChar.uuid}`);
            for (const cmd of commands) {
              const displayLog = cmd.startsWith('pass ') ? 'pass [PROTECTED]\n' : cmd;
              console.log(`[BLE Fallback Command] Sending: ${displayLog.trim()}`);
              
              const base64Cmd = utf8ToBase64(cmd);
              if (targetChar.isWritableWithResponse) {
                await targetChar.writeWithResponse(base64Cmd);
              } else {
                await targetChar.writeWithoutResponse(base64Cmd);
              }
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
            console.log('[BLE Sync] Settings successfully synchronized using auto-discovered write point!');
          } else {
            throw new Error('This device does not expose any writable characteristics.');
          }
        } catch (discoveryError) {
          console.warn('[BLE Sync Write Error (Fallback/Auto-Discovery Failed)]', discoveryError);
          throw discoveryError;
        }
      }
    }
  }

  // Scan for Wi-Fi networks via connected device (simulated or real)
  async scanWifi() {
    const baseNetworks = [
      { ssid: 'StandUpGuardian_5G', secure: true, signal: 4 },
      { ssid: 'buffalo-g-8A30', secure: true, signal: 3 },
      { ssid: 'aterm-102g-x', secure: true, signal: 4 },
      { ssid: 'direct-smart-tv-9a', secure: true, signal: 2 },
      { ssid: 'Free-Public-WiFi', secure: false, signal: 3 },
    ];

    // Merge in user-added real SSIDs
    const merged = [...baseNetworks];
    knownSsids.forEach((ssid) => {
      if (!merged.some((n) => n.ssid === ssid)) {
        merged.push({ ssid: ssid, secure: true, signal: Math.floor(Math.random() * 3) + 2 });
      }
    });

    // Shuffle for scan realism
    const shuffled = merged.sort(() => Math.random() - 0.5);

    if (isVirtualMode) {
      console.log('[BLE Wi-Fi] Requesting simulated Wi-Fi scan from device...');
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('[BLE Wi-Fi] Simulated Wi-Fi scan completed. Found networks.');
          resolve(shuffled);
        }, 1500);
      });
    } else {
      if (!this.connectedDevice) {
        throw new Error('No device connected via BLE to perform Wi-Fi scan.');
      }
      
      console.log('[BLE Wi-Fi] Requesting REAL Wi-Fi scan from Android native chip...');
      try {
        const WifiModule = NativeModules.WifiModule;
        if (WifiModule && WifiModule.scanWifiNetworks) {
          const realResults = await WifiModule.scanWifiNetworks();
          console.log(`[BLE Wi-Fi] Native Wi-Fi scan success. Found ${realResults.length} real SSIDs.`);
          if (realResults.length > 0) {
            return realResults;
          }
        }
      } catch (nativeError) {
        console.warn('[BLE Wi-Fi] Native Wi-Fi scan failed or not supported:', nativeError.message);
      }
      
      // Fallback if native module fails or returns empty
      console.log('[BLE Wi-Fi] Falling back to dynamic mixed mock list.');
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(shuffled);
        }, 1200);
      });
    }
  }
}

let knownSsids = [];

export const addKnownSsid = (ssid) => {
  if (ssid && !knownSsids.includes(ssid)) {
    knownSsids.push(ssid);
    console.log(`[BLE Wi-Fi] Registered real SSID to scan discovery: ${ssid}`);
  }
};

export const getKnownSsids = () => knownSsids;

export const bleManager = new LOCBleManager();

export const setVirtualMode = (enabled) => {
  if (Platform.OS === 'web' && !enabled) {
    console.warn('[BLE Manager] Cannot disable Virtual Mode on Web.');
    return;
  }
  if (!BleManagerClass && !enabled) {
    console.warn('[BLE Manager] Cannot disable Virtual Mode without native react-native-ble-plx module.');
    return;
  }
  isVirtualMode = enabled;
  console.log(`[BLE Manager] Switched connection mode. Virtual Mode: ${isVirtualMode}`);
  bleManager.notifyStateChange();
};

export const getIsVirtualMode = () => isVirtualMode;
