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
#include <ArduinoJson.h>
#include "config.h"
#include "apis.h"

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
// (API functions are now implemented in apis.h)

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
    } else if (input == "owner") {
        String currentOwner = bleOwnerToken.isEmpty() ? myOwnerToken : bleOwnerToken;
        blePrintln("Owner UUID: " + currentOwner);
    } else if (input == "update") {
        if (updateOwnerToken()) {
            blePrintln("Token update success");
        } else {
            blePrintln("Token update failed");
        }
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
    String html = String(configPage);
    html.replace("name=\"ssid\"", "name=\"ssid\" value=\"" + loadSSID() + "\"");
    html.replace("name=\"token\"", "name=\"token\" value=\"" + myOwnerToken + "\"");
    server.send(200, "text/html", html);
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
    Serial.println("Owner UUID: " + myOwnerToken);

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

    String ssid = loadSSID();
    if (ssid.isEmpty()) {
        // 設定がない場合はBLEモードで設定を待つ
        Serial.println("No Wi-Fi credentials. Starting BLE Config Mode...");
        startBleConfig();
    } else {
        // 設定がある場合はWi-Fi接続を試みる
        Serial.println("Wi-Fi credentials found. Connecting...");
        if (!connectWiFi()) {
            Serial.println("Initial Wi-Fi connection failed. Proceeding to normal mode to retry in background.");
        } else {
            // 時刻同期
            initNTP();
            // Wi-Fi接続成功時、未登録なら自己登録
            if (!isRegistered) {
                registerDevice();
            }
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
            sendExecutionAck("success"); // 実行完了を通知
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
            blePrintln("  owner            - Show owner UUID");
            blePrintln("  update           - Request token update");
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
        
        // 未登録かつWi-Fi接続済みの場合は自己登録を試みる
        if (WiFi.status() == WL_CONNECTED && !isRegistered) {
            static bool ntpInitDone = false;
            if (!ntpInitDone) {
                initNTP();
                ntpInitDone = true;
            }
            registerDevice();
        }
        
        // サーバーへの定期ポーリング処理
        if (millis() - lastPollTime >= pollInterval) {
            pollServer(sensor.readValue());
            lastPollTime = millis();
        }
        
        delay(10);
    }
}
