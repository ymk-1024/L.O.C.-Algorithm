#include <Arduino.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WebServer.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

#define POWER_LED      2
#define STATUS_LED     4
#define MOTOR_PWM1     16
#define MOTOR_PWM2     17
#define MOTOR_PWM3     18
#define MOTOR_PWM4     19
#define MOTOR_PWM5     21
#define MOTOR_PWM6     22
#define MOTOR_PWM7     23
#define MOTOR_PWM8     25
#define MOTOR_PWM9     26
#define MOTOR_PWM10    27
#define EXPAND_PIN1    32
#define EXPAND_PIN2    33
#define SENSOR_IN      34
#define CONFIG_RESET   13

// バックエンドサーバーのベースURL (実環境に合わせて変更可能)
#define BACKEND_BASE_URL "http://192.168.1.100:3000" 

const int freq = 5000;
const int resolution = 8;

Preferences prefs;
WebServer server(80);

// BLE & Wi-Fi configuration variables
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E" // NUS UART Service UUID
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_ID "6E400004-B5A3-F393-E0A9-E50E24DCCA9E"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;
String rxBuffer = "";

bool configMode = false;
bool bleMode = false;
String bleSSID = "";
String blePassword = "";
String bleOwnerToken = ""; // BLEから受信するOwnerToken用

String myDeviceUUID = "";
String myOwnerToken = "";
bool isRegistered = false; // デバイスがサーバーに登録済みか

// ポーリング制御用変数
unsigned long lastPollTime = 0;
unsigned long pollInterval = 10000; // デフォルト10秒間隔
bool isVibrating = false;
unsigned long vibrationStartTime = 0;

// ====================
// Hardware Classes
// ====================

class MotorController {
private:
    int motorPin;
    int channel;
    static int nextChannel;
public:
    MotorController(int pin) : motorPin(pin), channel(nextChannel++) {}
    void begin() {
        ledcSetup(channel, freq, resolution);
        ledcAttachPin(motorPin, channel);
    }
    void setSpeed(uint8_t speed) {
        ledcWrite(channel, speed);
    }
};

int MotorController::nextChannel = 0;

class LEDController {
private:
    int ledPin;
public:
    LEDController(int pin) : ledPin(pin) {}
    void begin() {
        pinMode(ledPin, OUTPUT);
    }
    void setState(bool state) {
        digitalWrite(ledPin, state ? HIGH : LOW);
    }
    void toggle() {
        digitalWrite(ledPin, !digitalRead(ledPin));
    }
};

class SensorController {
private:
    int sensorPin;
public:
    SensorController(int pin) : sensorPin(pin) {}
    void begin() {
        pinMode(sensorPin, INPUT);
    }
    int readValue() {
        return digitalRead(sensorPin);
    }
};

class ExpandablePinController {
private:
    int pin;
public:
    ExpandablePinController(int pinNum) : pin(pinNum) {}
    void begin() {
        pinMode(pin, OUTPUT);
    }
    void setState(bool state) {
        digitalWrite(pin, state ? HIGH : LOW);
    }
};

class SwController {
private:
    int swPin;
public:
    SwController(int pin) : swPin(pin) {}
    void begin() {
        pinMode(swPin, INPUT_PULLUP);
    }
    bool isPressed() {
        return digitalRead(swPin) == LOW;
    }
};

// Hardware Objects
LEDController statusLED(STATUS_LED);
LEDController powerLED(POWER_LED);

MotorController vibe1(MOTOR_PWM1);
MotorController vibe2(MOTOR_PWM2);
MotorController vibe3(MOTOR_PWM3);
MotorController vibe4(MOTOR_PWM4);
MotorController vibe5(MOTOR_PWM5);
MotorController vibe6(MOTOR_PWM6);
MotorController vibe7(MOTOR_PWM7);
MotorController vibe8(MOTOR_PWM8);
MotorController vibe9(MOTOR_PWM9);
MotorController vibe10(MOTOR_PWM10);

SensorController sensor(SENSOR_IN);
ExpandablePinController expand1(EXPAND_PIN1);
ExpandablePinController expand2(EXPAND_PIN2);
SwController configResetSw(CONFIG_RESET);

// 全モーターの速度を設定するヘルパー
void setAllMotorsSpeed(uint8_t speed) {
    vibe1.setSpeed(speed);
    vibe2.setSpeed(speed);
    vibe3.setSpeed(speed);
    vibe4.setSpeed(speed);
    vibe5.setSpeed(speed);
    vibe6.setSpeed(speed);
    vibe7.setSpeed(speed);
    vibe8.setSpeed(speed);
    vibe9.setSpeed(speed);
    vibe10.setSpeed(speed);
}

// ====================
// UUID Generation & Preferences
// ====================

// RFC4122準拠のUUID v4生成ロジック
String generateUUID() {
    String uuid = "";
    for (int i = 0; i < 32; i++) {
        if (i == 8 || i == 12 || i == 16 || i == 20) {
            uuid += "-";
        }
        int r = esp_random() % 16;
        if (i == 12) {
            uuid += "4"; // UUID version 4
        } else if (i == 16) {
            uuid += String((r & 0x3) | 0x8, HEX); // UUID variant (8, 9, a, b)
        } else {
            uuid += String(r, HEX);
        }
    }
    return uuid;
}

void loadDeviceConfig() {
    prefs.begin("device_cfg", false);
    myDeviceUUID = prefs.getString("uuid", "");
    if (myDeviceUUID.isEmpty()) {
        myDeviceUUID = generateUUID();
        prefs.putString("uuid", myDeviceUUID);
        Serial.println("Generated new UUID: " + myDeviceUUID);
    } else {
        Serial.println("Loaded existing UUID: " + myDeviceUUID);
    }
    
    myOwnerToken = prefs.getString("token", "");
    isRegistered = prefs.getBool("registered", false);
    prefs.end();
}

void saveOwnerToken(const String& token) {
    prefs.begin("device_cfg", false);
    prefs.putString("token", token);
    prefs.end();
    myOwnerToken = token;
    Serial.println("Saved OwnerToken");
}

void setRegisteredState(bool state) {
    prefs.begin("device_cfg", false);
    prefs.putBool("registered", state);
    prefs.end();
    isRegistered = state;
    Serial.println("Device Registration Status: " + String(state ? "Registered" : "Unregistered"));
}

void clearWifiAndConfig() {
    prefs.begin("wifi", false);
    prefs.clear();
    prefs.end();
    
    prefs.begin("device_cfg", false);
    prefs.clear(); // UUIDも含めリセット
    prefs.end();
    
    myDeviceUUID = "";
    myOwnerToken = "";
    isRegistered = false;
    Serial.println("All config cleared.");
}

// ====================
// WiFi Management
// ====================

void saveWifi(const String& ssid, const String& password) {
    prefs.begin("wifi", false);
    prefs.putString("ssid", ssid);
    prefs.putString("pass", password);
    prefs.end();
}

String loadSSID() {
    prefs.begin("wifi", true);
    String value = prefs.getString("ssid", "");
    prefs.end();
    return value;
}

String loadPassword() {
    prefs.begin("wifi", true);
    String value = prefs.getString("pass", "");
    prefs.end();
    return value;
}

// ====================
// Security & API Communication
// ====================

// ランダムなnonceを生成する
String generateNonce() {
    String charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    String nonce = "";
    for (int i = 0; i < 16; i++) {
        nonce += charset[esp_random() % charset.length()];
    }
    return nonce;
}

// サーバーへ共通ヘッダを付与したHTTPリクエストを送信するヘルパー関数
bool sendApiRequest(const String& path, const String& method, const String& payload, String& response) {
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }

    WiFiClient client; // 実運用時は WiFiClientSecure と証明書検証を使用
    HTTPClient http;
    String url = String(BACKEND_BASE_URL) + path;
    
    http.begin(client, url);
    
    // 設計仕様書に定義されている共通ヘッダの追加
    String nonce = generateNonce();
    // 本来はNTPで同期したUNIX時間を使用。ここでは代替としてmillis()を使用
    String timestamp = String(millis() / 1000 + 1700000000); 

    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Nonce", nonce);
    http.addHeader("X-Timestamp", timestamp);
    http.addHeader("X-Device-UUID", myDeviceUUID);
    
    if (!myOwnerToken.isEmpty()) {
        http.addHeader("Authorization", "Bearer " + myOwnerToken);
    }

    int httpCode = -1;
    if (method == "POST") {
        httpCode = http.POST(payload);
    } else if (method == "GET") {
        httpCode = http.GET();
    } else if (method == "PUT") {
        httpCode = http.PUT(payload);
    }

    if (httpCode > 0) {
        response = http.getString();
        Serial.printf("[HTTP] %s to %s response: %d\n", method.c_str(), path.c_str(), httpCode);
        http.end();
        return (httpCode >= 200 && httpCode < 300);
    } else {
        Serial.printf("[HTTP] %s failed, error: %s\n", method.c_str(), http.errorToString(httpCode).c_str());
        http.end();
        return false;
    }
}

// デバイスの自己登録
bool registerDevice() {
    if (myOwnerToken.isEmpty()) {
        Serial.println("Skipping registration: OwnerToken is empty.");
        return false;
    }

    Serial.println("Registering device on server...");
    
    // 設計書と現状のバックエンドスキーマを想定したペイロード
    String payload = "{\"userUuid\":\"" + myOwnerToken + "\",\"name\":\"LOC-Device\",\"type\":\"cushion\",\"status\":\"active\"}";
    String response = "";
    
    if (sendApiRequest("/api/v1.0/device", "POST", payload, response)) {
        setRegisteredState(true);
        return true;
    }
    return false;
}

// サーバーへの定期ポーリングと状態送信
void pollServer() {
    if (WiFi.status() != WL_CONNECTED || !isRegistered) {
        return;
    }

    Serial.println("Polling server for events...");
    
    int seatState = sensor.readValue(); // 着座状態 (1 = 着座, 0 = 起立 など)
    
    // ポーリングパス。クエリで現在の着座状態も送信
    String path = "/api/v1.0/sit_data?status=" + String(seatState);
    String response = "";

    if (sendApiRequest(path, "GET", "", response)) {
        // レスポンスの簡易パース (それっぽく制御を分岐)
        // 本来はArduinoJsonを使用しますが、文字列検索で対応します
        
        // 1. 振動イベントの検知
        if (response.indexOf("\"vibrate\":true") != -1 || response.indexOf("\"vibrate\": 1") != -1) {
            Serial.println("Vibration event triggered by server!");
            isVibrating = true;
            vibrationStartTime = millis();
            setAllMotorsSpeed(200); // モーター起動
        }
        
        // 2. 動的ポーリング間隔の変更検知 (ミリ秒指定)
        if (response.indexOf("\"interval\":") != -1) {
            int idx = response.indexOf("\"interval\":");
            // 簡単な数値抽出
            String intervalStr = "";
            for (size_t i = idx + 11; i < response.length(); i++) {
                char c = response[i];
                if (c >= '0' && c <= '9') {
                    intervalStr += c;
                } else if (intervalStr.length() > 0) {
                    break;
                }
            }
            if (intervalStr.length() > 0) {
                pollInterval = intervalStr.toInt();
                Serial.printf("Polling interval changed to: %d ms\n", pollInterval);
            }
        } else {
            // 設計書要件「次回イベント時刻に近づいた場合は1秒間隔に切り替える」のモック実装
            if (response.indexOf("\"nextEventTime\":") != -1) {
                int idx = response.indexOf("\"nextEventTime\":");
                String nextTimeStr = "";
                for (size_t i = idx + 16; i < response.length(); i++) {
                    char c = response[i];
                    if (c >= '0' && c <= '9') {
                        nextTimeStr += c;
                    } else if (nextTimeStr.length() > 0) {
                        break;
                    }
                }
                if (nextTimeStr.length() > 0) {
                    long long nextEventTime = atoll(nextTimeStr.c_str());
                    long long currentTime = millis() / 1000 + 1700000000;
                    long long diff = nextEventTime - currentTime;
                    
                    if (diff > 0 && diff < 30) { // イベントまで30秒未満
                        pollInterval = 1000; // 1秒ポーリングに切り替え
                        Serial.println("Event approaching. Switched to 1s polling interval.");
                    } else {
                        pollInterval = 10000; // 通常の10秒間隔
                    }
                }
            }
        }
    }
}

// ====================
// BLE Management (Nordic UART Service)
// ====================

void processBleCommand(const String& input);
void blePrintln(const String& msg);

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) override {
        deviceConnected = true;
    }

    void onDisconnect(BLEServer* pServer) override {
        deviceConnected = false;
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) override {
        std::string rxValue = pCharacteristic->getValue();
        if (rxValue.length() > 0) {
            for (size_t i = 0; i < rxValue.length(); i++) {
                char c = rxValue[i];
                if (c == '\n') {
                    rxBuffer.trim();
                    if (!rxBuffer.isEmpty()) {
                        processBleCommand(rxBuffer);
                        rxBuffer = "";
                    }
                } else if (c != '\r') {
                    rxBuffer += c;
                }
            }
        }
    }
};

void blePrint(const String& msg) {
    if (deviceConnected && pTxCharacteristic != NULL) {
        pTxCharacteristic->setValue(msg.c_str());
        pTxCharacteristic->notify();
        delay(20); // BLEバッファ飽和防止
    }
}

void blePrintln(const String& msg) {
    blePrint(msg + "\n");
}

void startBleConfig() {
    bleMode = true;
    configMode = true;
    bleSSID = "";
    blePassword = "";
    bleOwnerToken = "";

    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_OFF);

    // BLEの初期化
    BLEDevice::init("LOC-Controller");

    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);

    pTxCharacteristic = pService->createCharacteristic(
                          CHARACTERISTIC_UUID_TX,
                          BLECharacteristic::PROPERTY_NOTIFY
                        );
                      
    pTxCharacteristic->addDescriptor(new BLE2902());

    BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
                                             CHARACTERISTIC_UUID_RX,
                                             BLECharacteristic::PROPERTY_WRITE
                                           );

    pRxCharacteristic->setCallbacks(new MyCallbacks());

    BLECharacteristic *pIdCharacteristic = pService->createCharacteristic(
                                             CHARACTERISTIC_UUID_ID,
                                             BLECharacteristic::PROPERTY_READ
                                           );
    pIdCharacteristic->setValue(myDeviceUUID.c_str()); // 動的生成されたUUIDを設定

    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // iOS対策
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.println("===== BLE CONFIG MODE =====");
    Serial.println("BLE UART Service started. Device name: LOC-Controller");
}

void processBleCommand(const String& input) {
    if (input.startsWith("ssid ")) {
        bleSSID = input.substring(5);
        bleSSID.trim();
        blePrintln("SSID: " + bleSSID);
    } else if (input.startsWith("pass ")) {
        blePassword = input.substring(5);
        blePassword.trim();
        blePrintln("Password set");
    } else if (input.startsWith("token ")) { // [NEW] BLEコマンドからOwnerTokenを設定可能にする
        bleOwnerToken = input.substring(6);
        bleOwnerToken.trim();
        blePrintln("OwnerToken set");
    } else if (input == "save") {
        if (bleSSID.isEmpty()) {
            blePrintln("Error: SSID not set");
            return;
        }
        saveWifi(bleSSID, blePassword);
        if (!bleOwnerToken.isEmpty()) {
            saveOwnerToken(bleOwnerToken);
        }
        setRegisteredState(false); // 設定変更時は再登録を促す
        blePrintln("Saved. Rebooting...");
        delay(1000);
        ESP.restart();
    } else if (input == "cancel") {
        blePrintln("Cancelled");
        delay(500);
        ESP.restart();
    } else if (input == "uuid") {
        blePrintln("UUID: " + myDeviceUUID);
    } else {
        blePrintln("Unknown command: " + input);
    }
}

// ====================
// Web UI
// ====================

// [UPDATE] OwnerToken の入力欄を追加
const char* configPage = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>LOC Setup</title>
</head>
<body>
<h2>LOC WiFi Setup</h2>
<form action="/save" method="POST">
SSID<br>
<input type="text" name="ssid"><br><br>
Password<br>
<input type="password" name="password"><br><br>
OwnerToken (Server Auth)<br>
<input type="text" name="token"><br><br>
<button type="submit">Save</button>
</form>
</body>
</html>
)rawliteral";

void handleRoot() {
    server.send(200, "text/html", configPage);
}

void handleSave() {
    if (!server.hasArg("ssid")) {
        server.send(400, "text/plain", "SSID Missing");
        return;
    }

    String ssid = server.arg("ssid");
    String password = server.arg("password");
    String token = server.arg("token");

    saveWifi(ssid, password);
    if (!token.isEmpty()) {
        saveOwnerToken(token);
    }
    setRegisteredState(false); // 再登録フラグ

    server.send(200, "text/html", "<h1>Saved</h1><p>Rebooting...</p>");

    delay(2000);
    ESP.restart();
}

void startWebServer() {
    server.on("/", HTTP_GET, handleRoot);
    server.on("/save", HTTP_POST, handleSave);
    server.begin();
    Serial.println("Web Server Started");
}

void startConfigMode() {
    configMode = true;
    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_AP);
    WiFi.softAP("LOC-Setup");

    Serial.println("===== CONFIG MODE =====");
    Serial.println(WiFi.softAPIP());

    startWebServer();
}

// ====================
// WiFi Connection
// ====================

bool connectWiFi() {
    String ssid = loadSSID();
    String pass = loadPassword();

    if (ssid.isEmpty())
        return false;

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pass.c_str());

    unsigned long startTime = millis();

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        if (millis() - startTime > 15000)
            return false;
    }

    Serial.println("WiFi Connected");
    Serial.println(WiFi.localIP());
    return true;
}

// ====================
// Setup
// ====================

void setup() {
    Serial.begin(115200);
    delay(1000);

    // デバイス設定ロード (UUID自動生成/ロード含む)
    loadDeviceConfig();

    powerLED.begin();
    statusLED.begin();
    sensor.begin();
    expand1.begin();
    expand2.begin();
    configResetSw.begin();

    vibe1.begin();
    vibe2.begin();
    vibe3.begin();
    vibe4.begin();
    vibe5.begin();
    vibe6.begin();
    vibe7.begin();
    vibe8.begin();
    vibe9.begin();
    vibe10.begin();

    powerLED.setState(true);

    Serial.println();
    Serial.println("LOC Controller Boot");
    Serial.println("Device UUID: " + myDeviceUUID);

    delay(100);

    if (configResetSw.isPressed()) {
        clearWifiAndConfig();
        Serial.println("WiFi Config & Device Config Cleared");
        delay(500);

        // 長押し: BLEモード
        delay(2000);
        if (configResetSw.isPressed()) {
            Serial.println("Entering BLE Config Mode");
            startBleConfig();
            return;
        } else {
            // Webサーバーモード
            Serial.println("Entering Web Config Mode");
            startConfigMode();
            return;
        }
    }

    if (!connectWiFi()) {
        // デフォルト: BLE config mode
        Serial.println("No Wi-Fi credentials or connection failed. Starting BLE Config Mode...");
        startBleConfig();
    } else {
        // Wi-Fi接続成功時、未登録なら自己登録
        if (!isRegistered) {
            registerDevice();
        }
    }
}

// ====================
// Loop
// ====================

void loop() {
    // 振動モーター動作制御 (非ブロッキングで一定時間振動)
    if (isVibrating) {
        if (millis() - vibrationStartTime > 5000) { // 5秒間振動
            setAllMotorsSpeed(0); // モーター停止
            isVibrating = false;
            Serial.println("Vibration finished.");
        }
    }

    if (bleMode) {
        // BLE接続処理
        if (deviceConnected && !oldDeviceConnected) {
            delay(500); // 接続安定待ち
            blePrintln("LOC Controller - WiFi Configuration");
            blePrintln("Commands:");
            blePrintln("  ssid <name>      - Set WiFi SSID");
            blePrintln("  pass <password>  - Set WiFi Password");
            blePrintln("  token <token>    - Set OwnerToken");
            blePrintln("  uuid             - Show device identifier UUID");
            blePrintln("  save             - Save and reboot");
            blePrintln("  cancel           - Exit");
            oldDeviceConnected = deviceConnected;
        }
        if (!deviceConnected && oldDeviceConnected) {
            delay(500);
            pServer->startAdvertising(); // アドバタイズ再開
            Serial.println("Restarted BLE advertising");
            oldDeviceConnected = deviceConnected;
        }

        static uint32_t lastBlink = 0;
        if (millis() - lastBlink > 500) {
            statusLED.toggle();
            lastBlink = millis();
        }
    } else if (configMode) {
        server.handleClient();

        static uint32_t lastBlink = 0;
        if (millis() - lastBlink > 500) {
            statusLED.toggle();
            lastBlink = millis();
        }
    } else {
        // 通常動作モード
        statusLED.setState(true);
        
        // サーバーへの定期ポーリング処理
        if (millis() - lastPollTime >= pollInterval) {
            pollServer();
            lastPollTime = millis();
        }
        
        delay(10);
    }
}
