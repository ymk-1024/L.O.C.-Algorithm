# L.O.C. Controller ハードウェア・ファームウェア仕様書

本ドキュメントは、`loc-hard`（デバイス側ファームウェア）のセットアップ手順、内部仕様、通信プロトコル、およびデバッグ方法についてまとめた総合仕様書です。

---

## 1. 開発環境のセットアップ

本プロジェクトは **PlatformIO (VSCode 拡張機能)** を使用して開発・ビルドを行います。

### 1.1 プロジェクト構成
- **フレームワーク**: Arduino
- **対象ボード**: ESP32 Dev Module (`esp32dev`)
- **パーティション設定**: `huge_app.csv` (大容量アプリ用設定)

### 1.2 依存関係 (`platformio.ini`)
JSON 形式のパースおよび構築を行うため、外部ライブラリ `ArduinoJson` に依存しています。
```ini
lib_deps =
    bblanchon/ArduinoJson@^6.21.3
```

### 1.3 ビルド手順
PlatformIO Core がインストールされている環境で、プロジェクトディレクトリにて以下を実行します。
```bash
# ビルド (コンパイル検証)
pio run

# デバイスへの書き込み (シリアル接続時)
pio run --target upload

# シリアルモニターの起動
pio device monitor -b 115200
```

---

## 2. 動作設定 (`src/config.h`)

接続先サーバーや暗号化、時刻同期に関するパラメータは [config.h](file:///c:/develop/L.O.C.-Algorithm/hard/loc-hard/src/config.h) で管理します。

```cpp
// SSL (HTTPS) の有効/無効設定 (1: 有効, 0: 無効)
#define USE_SSL 0

// SSL有効時の証明書検証 (1: 検証する, 0: 検証しない [開発・テスト環境用])
#define SSL_VERIFY_CERT 0

// バックエンドサーバーのベースURL (USE_SSL に応じてプロトコルが自動で切り替わる)
#if USE_SSL
  #define BACKEND_BASE_URL "https://localhost:3000"
#else
  #define BACKEND_BASE_URL "http://localhost:3000"
#endif

// NTPサーバー設定
#define NTP_SERVER1 "pool.ntp.org"
#define NTP_SERVER2 "time.nist.gov"
#define TIME_ZONE_SEC (9 * 3600) // 日本標準時 (JST = UTC+9)
#define DAYLIGHT_OFFSET_SEC 0
```

---

## 3. 起動フローと設定モード遷移

デバイスの起動時、設定ボタン（`CONFIG_RESET`: GPIO 13）の押下状態や、保存されている設定状況に応じて動作モードが遷移します。

```mermaid
graph TD
    Start([起動]) --> Load[設定データのロード]
    Load --> CheckBtn{CONFIG_RESET<br>ボタン押下?}
    
    %% ボタン押下時
    CheckBtn -- YES --> Clear[Wi-Fi & デバイス設定の消去]
    Clear --> Delay2s{ボタン2秒以上<br>長押し?}
    Delay2s -- YES --> BLE_Mode[BLE 設定モード]
    Delay2s -- NO --> Web_Mode[Web UI 設定モード]
    
    %% 通常起動時
    CheckBtn -- NO --> CheckConfig{Wi-Fi設定<br>(SSID) が存在?}
    CheckConfig -- NO --> BLE_Mode
    CheckConfig -- YES --> Connect{Wi-Fi接続を試行}
    
    Connect -- 接続成功 --> CheckReg{サーバー登録済み?}
    CheckReg -- YES --> Normal[通常動作モード]
    CheckReg -- NO --> Register[サーバーに自己登録]
    Register --> Normal
    
    Connect -- 接続失敗<br>(タイムアウト) --> Normal_Pending[通常動作モード<br>(バックグラウンドで接続・登録待ち)]
```

### 3.1 CONFIG_RESET ボタンによる強制初期化
起動時に `CONFIG_RESET`（GPIO 13）ピンが LOW（スイッチ押下状態）である場合、直ちに以下の処理が行われます。
1. **設定のクリア**: `Preferences`（不揮発メモリ）内のすべての設定（Wi-Fi、UUID、OwnerToken、登録状態）を消去します。
2. **長押し判定**:
   - **2秒以上の長押し**: **BLE 設定モード** を開始します。
   - **2秒未満で離す**: **Web UI 設定モード** を開始します。

### 3.2 通常起動と接続待機
起動時にボタンが押されていない場合、保存されたWi-Fi情報（SSID）の有無を確認します。
- **未設定の場合**: 自動的に **BLE 設定モード** が起動します。
- **設定済みの場合**: Wi-Fi 接続を試みます。
  - **接続成功**: 時刻同期 (NTP) を実行後、未登録ならサーバーに自己登録を行い、通常動作モードへ移行します。
  - **接続失敗 (15秒タイムアウト)**: BLE モードには入らず、通常動作モードに入ります。裏で自動的に接続を試み続け、後から接続が確立されたタイミングで時刻同期と自己登録を行います。

---

## 4. 各種設定インターフェース仕様

### 4.1 BLE 設定モード (BLE Config Mode)
- **デバイス名**: `LOC-Controller` (Nordic UART Service 準拠)
- **サービス UUID**: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- **インジケータ**: ステータスLED（GPIO 4）が **500ms 周期で点滅**
- **BLE 特性 (Characteristic)**:
  - **RX (WRITE / `...0002...`)**: クライアントからデバイスへのコマンド送信
  - **TX (NOTIFY / `...0003...`)**: デバイスからクライアントへの結果・ログ通知
  - **ID (READ / `...0004...`)**: デバイス固有の UUID の取得

#### BLE コマンド一覧

| コマンド | 引数 | 説明 |
| :--- | :--- | :--- |
| `ssid` | `<SSID>` | 接続する Wi-Fi の SSID を一時保持します。 |
| `pass` | `<Password>`| 接続する Wi-Fi のパスワードをメモリ上に一時保持します。 |
| `token`| `<Token>` | サーバー認証用 `OwnerToken` をメモリ上に一時保持します。 |
| `uuid` | なし | デバイス固有の識別ID (Device UUID) を返却します。 |
| `owner`| なし | 現在一時保持または保存されている `OwnerUUID` (`OwnerToken`) を返却します。 |
| `update`| なし | サーバーに対してトークン更新リクエストを送信し、疎通テスト完了後保存します。 |
| `save` | なし | メモリ上の設定値を `Preferences` に書き込んで再起動します。 |
| `cancel`| なし | 設定を保存せず、デバイスを再起動します。 |

### 4.2 Web UI 設定モード (Web Config Mode)
- **Wi-Fi モード**: softAP モード (SSID: `LOC-Setup` / パスワードなし)
- **デフォルト IP**: `192.168.4.1:80`
- **インジケータ**: ステータスLED（GPIO 4）が **500ms 周期で点滅**
- **提供ルーティング**:
  - `GET /`: 設定入力フォーム（SSID、Password、OwnerToken 入力）。**現在保存されている値が自動でプレフィルされます。**
  - `POST /save`: 入力値を `Preferences` に保存し、デバイスを再起動します。

---

## 5. デバイス向けAPIとの通信仕様

通信は [apis.h](file:///c:/develop/L.O.C.-Algorithm/hard/loc-hard/src/apis.h) に集約されています。

### 5.1 共通リクエストヘッダ
API通信時には、リクエストごとに以下の独自ヘッダおよび認証ヘッダが付与されます。

| ヘッダ名 | 内容 | 備考 |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | |
| `X-Nonce` | 16桁のランダムな文字列 | リプレイ攻撃対策 |
| `X-Timestamp` | UNIX タイムスタンプ (秒) | NTP同期時刻（未同期時はモック秒） |
| `X-Device-UUID` | デバイス固有の UUID (v4) | 初回起動時に自動生成 |
| `Authorization` | `Bearer <OwnerToken>` | 設定済みのトークンがある場合のみ付与 |

### 5.2 各種 API 処理

#### ① デバイス自己登録 (`POST /api/v1.0/device`)
デバイス起動時（または接続確立時）、未登録である場合に呼び出されます。
```json
// 送信ペイロード
{
  "userUuid": "<OwnerToken>",
  "name": "LOC-Device",
  "type": "cushion",
  "status": "active"
}
```

#### ② 定期ポーリング (`GET /api/v1.0/sit_data?status=<seatState>`)
通常動作モード中、設定されたポーリング間隔（デフォルト 10 秒）で実行され、センサの現在の着座状態（`1` または `0`）を送信します。
- **振動検知**: レスポンス内に `"vibrate": true` (または `1`) がある場合、10基の振動モーターを一斉に5秒間駆動します。
- **ポーリング間隔の動的変更**:
  - レスポンス内に `interval` 値（ミリ秒）がある場合、その間隔に更新します。
  - レスポンス内に `nextEventTime` があり、イベントまで30秒未満に近づいた場合、ポーリングを一時的に **1秒間隔** に自動変更します。

#### ③ 安全なトークン更新 (`POST /api/v1.0/device/token`)
トークンの更新時に呼び出され、新トークンで疎通（自己登録）が成功した場合のみ ROM を書き換えます。
```json
// 送信ペイロード
{
  "currentOwnerToken": "<currentOwnerToken>",
  "deviceUuid": "<myDeviceUUID>",
  "model": "cushion"
}
```
```json
// 受信レスポンス
{
  "newToken": "<newToken>"
}
```

#### ④ 実行確認 ACK 送信 (`POST /api/v1.0/device/ack`)
モーターの振動動作が正常に終了したタイミングで、サーバーへ実行完了を通知します。
```json
// 送信ペイロード
{
  "deviceUuid": "<myDeviceUUID>",
  "status": "success",
  "timestamp": 1234567890
}
```

---

## 6. シリアル・デバッグログ仕様

動作状態を確認するため、シリアルモニター（ボーレート: `115200`）へ以下のログが逐次出力されます。

* **Wi-Fi 接続待機時**: `[WiFi] Connecting to SSID: XXX ...` と進捗のドットが出力され、接続成功時に IP アドレスが表示されます。
* **API 送受信時**: リクエストヘッダ、ボディ、レスポンスの HTTP ステータスおよびボディ全体が区切り線付きで出力されます。
* **着座状態の変化検知時**: センサが着座・起立を検知した瞬間、`[State Change] Seat State changed from X to Y` と即時出力されます。
* **イベント実行時**: 振動開始、完了、および完了後の ACK 送信ログが出力されます。