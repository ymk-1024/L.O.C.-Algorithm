# BLE & Wi-Fi 設定仕様書 (LOC-Controller)

本ドキュメントでは、`loc-hard`（デバイス側）におけるネットワーク接続設定（Wi-Fi）およびバックエンドサーバー認証トークン（OwnerToken）の設定仕様について解説します。

---

## 1. 起動フローとモード遷移条件

デバイス（ESP32）の起動時、設定ボタン（`CONFIG_RESET`: GPIO 13）の押下状態やWi-Fiの設定状況に応じて、以下のいずれかのモードで起動します。

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

### 1.1 CONFIG_RESET ボタンによる強制初期化と遷移
起動時に `CONFIG_RESET`（GPIO 13）ピンが LOW（スイッチ押下状態）である場合、直ちに以下の処理が行われます。

1. **設定のクリア (`clearWifiAndConfig`)**
   - `Preferences` に保存されているWi-Fi設定（SSID/Password）およびデバイス設定（UUID/OwnerToken/登録ステータス）をすべてクリアします。
2. **長押し判定によるモード分岐**
   - **長押し（2秒以上継続して押下）**: **BLE 設定モード** (`startBleConfig`) へ移行します。
   - **短押し（2秒未満で離す）**: **Web UI 設定モード** (`startConfigMode`) へ移行します。

### 1.2 通常起動とWi-Fi接続判定の条件分岐
起動時にボタンが押されていない場合、`Preferences` から保存済みのWi-Fi設定をチェックします。

- **Wi-Fi設定（SSID）が未設定の場合**:
  - 設定が何も存在しない（初期状態）とみなし、自動的に **BLE 設定モード** を起動します。
- **Wi-Fi設定（SSID）が存在する場合**:
  - 登録情報を用いてWi-Fiへの接続を試みます。
  - **起動時の接続に成功した場合**:
    - デバイスがサーバーに未登録 (`!isRegistered`) であれば、バックエンドに対して自己登録リクエスト (`/api/v1.0/device` へ POST) を送信し、登録成功後に通常動作モードへ移行します。
  - **起動時の接続に失敗した場合（15秒タイムアウト）**:
    - 自動的にBLE設定モードには移行せず、**そのまま通常動作モードとして動作を開始**します。接続処理はバックグラウンドでリトライされ続け、接続が確立されたタイミングで自動的にサーバーへの自己登録が試みられます。

---

## 2. データ永続化仕様 (Preferences)

設定情報は、ESP32 の非揮発性メモリ（Flash / NVS）に `Preferences` ライブラリを用いて保存されます。

### 2.1 保存データ一覧

| Namespace | Key | 型 | 内容 |
| :--- | :--- | :--- | :--- |
| `wifi` | `ssid` | `String` | 接続先 Wi-Fi の SSID |
| `wifi` | `pass` | `String` | 接続先 Wi-Fi の パスワード |
| `device_cfg` | `uuid` | `String` | デバイス固有の識別ID (UUID v4) |
| `device_cfg` | `token` | `String` | サーバー認証用トークン (`OwnerToken`) |
| `device_cfg` | `registered`| `bool` | サーバーへのデバイス自己登録完了フラグ |

### 2.2 デバイス固有UUIDの生成
- 初回起動時、`device_cfg` の `uuid` が空である場合、RFC4122 v4 に準拠した UUID が `esp_random()` を用いて自動生成され、永続保存されます。
- 生成された UUID は設定の消去（ファクトリーリセット）が行われるまで不変です。

---

## 3. BLE 設定モード (BLE Config Mode)

スマートフォンなどのクライアントアプリケーションから BLE (Bluetooth Low Energy) を経由して Wi-Fi と認証トークンの設定を行います。

### 3.1 BLE デバイス仕様
- **デバイス名**: `LOC-Controller`
- **サービス仕様**: Nordic UART Service (NUS) に準拠
- **サービス UUID**: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- **特性 (Characteristic) 一覧**:

| 特性 UUID | プロパティ | 用途 |
| :--- | :--- | :--- |
| `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` | `WRITE` (RX) | クライアントからデバイスへのコマンド送信 |
| `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` | `NOTIFY` (TX) | デバイスからクライアントへの結果・ログ通知 |
| `6E400004-B5A3-F393-E0A9-E50E24DCCA9E` | `READ` (ID) | デバイス固有の UUID (`myDeviceUUID`) の取得 |

### 3.2 インジケータ
- ステータスLED（`STATUS_LED`: GPIO 4）が **500ms 周期で点滅** します。

### 3.3 コマンド仕様 (RX 特性へ送信)
コマンドは改行コード (`\n`) で区切って送信します。

| コマンド | 引数 | 説明 |
| :--- | :--- | :--- |
| `ssid` | `<SSID>` | 接続する Wi-Fi の SSID をメモリ上に一時保持します。 |
| `pass` | `<Password>`| 接続する Wi-Fi のパスワードをメモリ上に一時保持します。 |
| `token`| `<Token>` | サーバー認証用 `OwnerToken` をメモリ上に一時保持します。 |
| `uuid` | なし | 現在のデバイス固有 UUID を TX 特性から返却します。 |
| `owner`| なし | 現在メモリ上に一時保持されている（または保存済みの） `OwnerUUID` (`OwnerToken`) を TX 特性から返却します。 |
| `update`| なし| サーバーに対してトークン更新リクエストを送信し、新しいトークンのテスト疎通確認に成功した場合に永続保存します。 |
| `save` | なし | 一時保持している情報を `Preferences` に書き込み、登録ステータスを `unregistered` (未登録) にリセットした上で、1秒後にデバイスを再起動 (`ESP.restart()`) します。<br>※ SSIDが未入力の場合はエラーとなります。 |
| `cancel`| なし | 設定を保存せず、デバイスを再起動します。 |

---

## 4. Web UI 設定モード (Web Config Mode)

PCやスマートフォンからデバイスのローカルアクセスポイントに Wi-Fi 接続し、ブラウザ（Web UI）を通じて設定を行います。

### 4.1 ネットワーク仕様
- **Wi-Fi モード**: アクセスポイント (softAP) モード
- **SSID**: `LOC-Setup`
- **パスワード**: なし (オープンネットワーク)
- **デフォルト IP アドレス**: `192.168.4.1`
- **Webサーバーポート**: `80`

### 4.2 インジケータ
- BLE設定モードと同様に、ステータスLED（`STATUS_LED`）が **500ms 周期で点滅** します。

### 4.3 提供エンドポイント (HTTP ルーティング)

#### ① 設定画面の取得
- **パス**: `GET /`
- **レスポンス**: HTMLドキュメント（設定入力フォーム）
  - **初期値の補完 (Prefill)**: すでに `Preferences` に保存されている SSID と OwnerToken の値が、それぞれ入力フィールドの初期値（`value` 属性）として自動で設定されます。
  - 入力項目:
    - **SSID** (`ssid`): 接続先 Wi-Fi の SSID
    - **Password** (`password`): 接続先 Wi-Fi のパスワード
    - **OwnerToken (Server Auth)** (`token`): サーバー認証用 `OwnerToken` (OwnerUUIDとして使用)
  
#### ② 設定値の保存と再起動
- **パス**: `POST /save`
- **リクエストパラメータ** (Form-Data / x-www-form-urlencoded):
  - `ssid` (必須)
  - `password` (任意)
  - `token` (任意)
- **処理内容**:
  1. 送信された `ssid` および `password` を `wifi` namespace に保存。
  2. `token` が送信されていれば `device_cfg` namespace に `OwnerToken` として保存。
  3. 登録フラグ (`registered`) を `false` にリセット。
  4. クライアントに "Saved. Rebooting..." と表示するレスポンスを返却。
  5. 2秒後にデバイスを再起動 (`ESP.restart()`)。
- **エラー処理**:
  - `ssid` が指定されていない場合、`400 Bad Request` ("SSID Missing") を返却します。
