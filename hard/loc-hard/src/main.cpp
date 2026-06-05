#include <Arduino.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WebServer.h>

// 仮置きのピン定義
#define POWER_LED 1
#define STATUS_LED 2

#define MOTOR_PWM1 3
#define MOTOR_PWM2 4
#define MOTOR_PWM3 5
#define MOTOR_PWM4 6
#define MOTOR_PWM5 7
#define MOTOR_PWM6 8
#define MOTOR_PWM7 9
#define MOTOR_PWM8 10
#define MOTOR_PWM9 11
#define MOTOR_PWM10 12

#define EXPAND_PIN1 13
#define EXPAND_PIN2 14

#define SENSOR_IN 15
#define SENSOR_OUT 16

#define CONFIG_RESET 17

// PWM設定
const int freq = 5000;
const int resolution = 8;

// ====================
// グローバル
// ====================

Preferences prefs;
WebServer server(80);

bool configMode = false;

// ====================
// ハードウェアクラス
// ====================

class MotorController
{
private:
    int motorPin;

public:
    MotorController(int pin)
        : motorPin(pin)
    {
        ledcAttach(motorPin, freq, resolution);
    }

    void setSpeed(uint8_t speed)
    {
        ledcWrite(motorPin, speed);
    }
};

class LEDController
{
private:
    int ledPin;

public:
    LEDController(int pin)
        : ledPin(pin)
    {
        pinMode(ledPin, OUTPUT);
    }

    void setState(bool state)
    {
        digitalWrite(ledPin, state ? HIGH : LOW);
    }

    void toggle()
    {
        digitalWrite(ledPin, !digitalRead(ledPin));
    }
};

class SensorController
{
private:
    int sensorPin;

public:
    SensorController(int pin)
        : sensorPin(pin)
    {
        pinMode(sensorPin, INPUT);
    }

    int readValue()
    {
        return digitalRead(sensorPin);
    }
};

class ExpandablePinController
{
private:
    int pin;

public:
    ExpandablePinController(int pinNum)
        : pin(pinNum)
    {
        pinMode(pin, OUTPUT);
    }

    void setState(bool state)
    {
        digitalWrite(pin, state ? HIGH : LOW);
    }
};

class SwController
{
private:
    int swPin;

public:
    SwController(int pin)
        : swPin(pin)
    {
        pinMode(swPin, INPUT_PULLUP);
    }

    bool isPressed()
    {
        return digitalRead(swPin) == LOW;
    }
};

// ====================
// WiFi設定
// ====================

void saveWifi(const String& ssid, const String& password)
{
    prefs.begin("wifi", false);

    prefs.putString("ssid", ssid);
    prefs.putString("pass", password);

    prefs.end();
}

String loadSSID()
{
    prefs.begin("wifi", true);
    String value = prefs.getString("ssid", "");
    prefs.end();

    return value;
}

String loadPassword()
{
    prefs.begin("wifi", true);
    String value = prefs.getString("pass", "");
    prefs.end();

    return value;
}

void clearWifi()
{
    prefs.begin("wifi", false);
    prefs.clear();
    prefs.end();
}

// ====================
// WebUI
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

<button type="submit">
Save
</button>

</form>

</body>
</html>
)rawliteral";

void handleRoot()
{
    server.send(200, "text/html", configPage);
}

void handleSave()
{
    if (!server.hasArg("ssid"))
    {
        server.send(400, "text/plain", "SSID Missing");
        return;
    }

    String ssid = server.arg("ssid");
    String password = server.arg("password");

    saveWifi(ssid, password);

    server.send(
        200,
        "text/html",
        "<h1>Saved</h1><p>Rebooting...</p>"
    );

    delay(2000);

    ESP.restart();
}

void startWebServer()
{
    server.on("/", HTTP_GET, handleRoot);
    server.on("/save", HTTP_POST, handleSave);

    server.begin();

    Serial.println("Web Server Started");
}

// ====================
// APモード
// ====================

void startConfigMode()
{
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
// WiFi接続
// ====================

bool connectWiFi()
{
    String ssid = loadSSID();
    String pass = loadPassword();

    if (ssid.isEmpty())
    {
        return false;
    }

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pass.c_str());

    unsigned long startTime = millis();

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);

        if (millis() - startTime > 15000)
        {
            return false;
        }
    }

    Serial.println("WiFi Connected");
    Serial.println(WiFi.localIP());

    return true;
}

// ====================
// ハード定義
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

void setup()
{
    Serial.begin(115200);

    powerLED.setState(true);

    Serial.println();
    Serial.println("LOC Controller Boot");

    if (configResetSw.isPressed())
    {
        clearWifi();

        Serial.println("WiFi Config Cleared");

        delay(1000);
    }

    if (!connectWiFi())
    {
        startConfigMode();
    }
}

// ====================
// Loop
// ====================

void loop()
{
    if (configMode)
    {
        server.handleClient();

        static uint32_t lastBlink = 0;

        if (millis() - lastBlink > 500)
        {
            statusLED.toggle();

            lastBlink = millis();
        }
    }
    else
    {
        statusLED.setState(true);

        // テスト
        vibe1.setSpeed(128);

        delay(10);
    }
}