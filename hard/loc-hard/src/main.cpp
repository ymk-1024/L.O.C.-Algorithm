#include <Arduino.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WebServer.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

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
#define INDIVIDUAL_IDENTIFIER_UUID "12345678-1234-5678-1234-56789abcdef0" // Unique identifier for this device (can be used for filtering in apps)
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

void clearWifi() {
    prefs.begin("wifi", false);
    prefs.clear();
    prefs.end();
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
        delay(20); // Small delay to avoid saturating BLE buffers
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

    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_OFF);

    // Initialize the BLE Device
    BLEDevice::init("LOC-Controller");

    // Create the BLE Server
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    // Create the BLE Service
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Create a BLE Characteristic for TX (Notify)
    pTxCharacteristic = pService->createCharacteristic(
                          CHARACTERISTIC_UUID_TX,
                          BLECharacteristic::PROPERTY_NOTIFY
                        );
                      
    pTxCharacteristic->addDescriptor(new BLE2902());

    // Create a BLE Characteristic for RX (Write)
    BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
                                             CHARACTERISTIC_UUID_RX,
                                             BLECharacteristic::PROPERTY_WRITE
                                           );

    pRxCharacteristic->setCallbacks(new MyCallbacks());

    // Create a BLE Characteristic for ID (Read)
    BLECharacteristic *pIdCharacteristic = pService->createCharacteristic(
                                             CHARACTERISTIC_UUID_ID,
                                             BLECharacteristic::PROPERTY_READ
                                           );
    pIdCharacteristic->setValue(INDIVIDUAL_IDENTIFIER_UUID);

    // Start the service
    pService->start();

    // Start advertising
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);  // help with iPhone connection issues
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
    } else if (input == "save") {
        if (bleSSID.isEmpty()) {
            blePrintln("Error: SSID not set");
            return;
        }
        saveWifi(bleSSID, blePassword);
        blePrintln("Saved. Rebooting...");
        delay(1000);
        ESP.restart();
    } else if (input == "cancel") {
        blePrintln("Cancelled");
        delay(500);
        ESP.restart();
    } else if (input == "uuid") {
        blePrintln("UUID: " + String(INDIVIDUAL_IDENTIFIER_UUID));
    } else {
        blePrintln("Unknown command: " + input);
    }
}

// ====================
// Web UI
// ====================

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

    saveWifi(ssid, password);
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
// Hardware Objects
// ====================

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

// ====================
// Setup
// ====================

void setup() {
    Serial.begin(115200);
    delay(1000);

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

    delay(100);

    if (configResetSw.isPressed()) {
        clearWifi();
        Serial.println("WiFi Config Cleared");
        delay(500);

        // Long press: BLE mode
        delay(2000);
        if (configResetSw.isPressed()) {
            Serial.println("Entering BLE Config Mode");
            startBleConfig();
            return;
        } else {
            // Web server mode
            Serial.println("Entering Web Config Mode");
            startConfigMode();
            return;
        }
    }

    if (!connectWiFi()) {
        // Default to BLE config mode
        Serial.println("No Wi-Fi credentials or connection failed. Starting BLE Config Mode...");
        startBleConfig();
    }
}

// ====================
// Loop
// ====================

void loop() {
    if (bleMode) {
        // Connection tracking and welcoming
        if (deviceConnected && !oldDeviceConnected) {
            delay(500); // Wait for connection to stabilize
            blePrintln("LOC Controller - WiFi Configuration");
            blePrintln("Commands:");
            blePrintln("  ssid <name>      - Set WiFi SSID");
            blePrintln("  pass <password>  - Set WiFi Password");
            blePrintln("  uuid             - Show device identifier UUID");
            blePrintln("  save             - Save and reboot");
            blePrintln("  cancel           - Exit");
            oldDeviceConnected = deviceConnected;
        }
        if (!deviceConnected && oldDeviceConnected) {
            delay(500); // Give the BLE stack a moment
            pServer->startAdvertising(); // restart advertising
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
        statusLED.setState(true);
        vibe1.setSpeed(128);
        delay(10);
    }
}
