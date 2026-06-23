#ifndef APIS_H
#define APIS_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <time.h>
#include "config.h"

// ====================
// Extern Variables from main.cpp
// ====================
extern String myDeviceUUID;
extern String myOwnerToken;
extern bool isRegistered;
extern unsigned long pollInterval;
extern bool isVibrating;
extern unsigned long vibrationStartTime;

// ====================
// Extern Helper Functions from main.cpp
// ====================
extern void saveOwnerToken(const String& token);
extern void setRegisteredState(bool state);
extern void setAllMotorsSpeed(uint8_t speed);

// ====================
// Time Sync (NTP)
// ====================

// NTPによる時刻同期の初期化
inline void initNTP() {
    Serial.println("Synchronizing time via NTP...");
    configTime(TIME_ZONE_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER1, NTP_SERVER2);
    
    // 同期待ち (最大5秒)
    time_t now = time(nullptr);
    unsigned long startMs = millis();
    while (now < 24 * 3600 && (millis() - startMs < 5000)) {
        delay(500);
        Serial.print(".");
        now = time(nullptr);
    }
    Serial.println();
    
    if (now >= 24 * 3600) {
        struct tm timeinfo;
        getLocalTime(&timeinfo);
        Serial.print("Time synchronized: ");
        Serial.println(asctime(&timeinfo));
    } else {
        Serial.println("Time synchronization failed (using baseline timestamp).");
    }
}

// 現在のUNIXタイムスタンプの取得
inline unsigned long getUnixTime() {
    time_t now = time(nullptr);
    // 時刻が同期されていない場合は、ダミーのベースライン時刻に稼働時間を足したモック値を返す
    if (now < 24 * 3600) {
        return millis() / 1000 + 1700000000;
    }
    return (unsigned long)now;
}

// ランダムなNonceの生成
inline String generateNonce() {
    String charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    String nonce = "";
    for (int i = 0; i < 16; i++) {
        nonce += charset[esp_random() % charset.length()];
    }
    return nonce;
}

// ====================
// API Communication
// ====================

// 共通ヘッダを付与したHTTP/HTTPSリクエストの送信
inline bool sendApiRequest(const String& path, const String& method, const String& payload, String& response) {
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }

    HTTPClient http;
    String url = String(BACKEND_BASE_URL) + path;
    int httpCode = -1;

#if USE_SSL
    WiFiClientSecure client;
    #if !SSL_VERIFY_CERT
        client.setInsecure(); // テスト環境等で証明書の自己署名・検証なしを許可
    #endif
    http.begin(client, url);
#else
    WiFiClient client;
    http.begin(client, url);
#endif

    // 共通ヘッダの追加
    String nonce = generateNonce();
    String timestamp = String(getUnixTime());

    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Nonce", nonce);
    http.addHeader("X-Timestamp", timestamp);
    http.addHeader("X-Device-UUID", myDeviceUUID);
    
    if (!myOwnerToken.isEmpty()) {
        http.addHeader("Authorization", "Bearer " + myOwnerToken);
    }

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
inline bool registerDevice() {
    if (myOwnerToken.isEmpty()) {
        Serial.println("Skipping registration: OwnerToken is empty.");
        return false;
    }

    Serial.println("Registering device on server...");
    
    StaticJsonDocument<256> doc;
    doc["userUuid"] = myOwnerToken;
    doc["name"] = "LOC-Device";
    doc["type"] = "cushion";
    doc["status"] = "active";
    
    String payload;
    serializeJson(doc, payload);
    String response = "";
    
    if (sendApiRequest("/api/v1.0/device", "POST", payload, response)) {
        setRegisteredState(true);
        return true;
    }
    return false;
}

// サーバーへの定期ポーリング
inline void pollServer(int seatState) {
    if (WiFi.status() != WL_CONNECTED || !isRegistered) {
        return;
    }

    Serial.println("Polling server for events...");
    
    // ポーリングパス。現在の着座状態をクエリパラメータとして送信
    String path = "/api/v1.0/sit_data?status=" + String(seatState);
    String response = "";

    if (sendApiRequest(path, "GET", "", response)) {
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, response);
        if (error) {
            Serial.print("JSON Deserialization failed: ");
            Serial.println(error.c_str());
            return;
        }

        // 1. 振動イベントの検知
        if (doc.containsKey("vibrate") && (doc["vibrate"] == true || doc["vibrate"] == 1)) {
            Serial.println("Vibration event triggered by server!");
            isVibrating = true;
            vibrationStartTime = millis();
            setAllMotorsSpeed(200); // モーター起動
        }
        
        // 2. 動的ポーリング間隔の変更検知
        if (doc.containsKey("interval")) {
            pollInterval = doc["interval"].as<unsigned long>();
            Serial.printf("Polling interval changed to: %lu ms\n", pollInterval);
        } else if (doc.containsKey("nextEventTime")) {
            // イベント接近時に1秒間隔へ切り替える処理
            unsigned long nextEventTime = doc["nextEventTime"].as<unsigned long>();
            unsigned long currentTime = getUnixTime();
            if (nextEventTime > currentTime) {
                unsigned long diff = nextEventTime - currentTime;
                if (diff < 30) { // イベントまで30秒未満
                    pollInterval = 1000;
                    Serial.println("Event approaching. Switched to 1s polling interval.");
                } else {
                    pollInterval = 10000; // 通常の10秒間隔
                }
            }
        }
    }
}

// 安全なOwnerTokenの更新処理
inline bool updateOwnerToken() {
    if (myOwnerToken.isEmpty()) {
        Serial.println("Cannot update token: current token is empty.");
        return false;
    }

    Serial.println("Requesting OwnerToken update...");
    
    StaticJsonDocument<256> doc;
    doc["currentOwnerToken"] = myOwnerToken;
    doc["deviceUuid"] = myDeviceUUID;
    doc["model"] = "cushion";
    
    String payload;
    serializeJson(doc, payload);
    String response = "";
    
    if (sendApiRequest("/api/v1.0/device/token", "POST", payload, response)) {
        StaticJsonDocument<256> resDoc;
        DeserializationError error = deserializeJson(resDoc, response);
        if (!error && resDoc.containsKey("newToken")) {
            String newToken = resDoc["newToken"].as<String>();
            
            // トークンの仮適用と疎通テスト
            String backupToken = myOwnerToken;
            myOwnerToken = newToken;
            
            Serial.println("Testing new OwnerToken...");
            if (registerDevice()) { // 自己登録で疎通テストを代用
                saveOwnerToken(newToken);
                Serial.println("OwnerToken updated and saved successfully.");
                return true;
            } else {
                myOwnerToken = backupToken; // ロールバック
                Serial.println("New token verification failed. Reverted to old token.");
            }
        } else {
            Serial.println("Invalid response format for token update.");
        }
    }
    return false;
}

// 実行確認 ACK 送信機能
inline bool sendExecutionAck(const String& status = "success") {
    Serial.println("Sending execution ACK to server...");
    
    StaticJsonDocument<256> doc;
    doc["deviceUuid"] = myDeviceUUID;
    doc["status"] = status;
    doc["timestamp"] = getUnixTime();
    
    String payload;
    serializeJson(doc, payload);
    String response = "";
    
    return sendApiRequest("/api/v1.0/device/ack", "POST", payload, response);
}

#endif // APIS_H
