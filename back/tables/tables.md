
---

### テーブル定義: users

ユーザー情報を管理するテーブルです。

| 物理名 (カラム名) | データ型 | NOT NULL | PK | FK | デフォルト値 / 属性 |
| --- | --- | --- | --- | --- | --- |
| **uuid** | VARCHAR(255) | 〇 | 〇 |  |  |
| **username** | VARCHAR(255) | 〇 |  |  |  |
| **password** | VARCHAR(255) |  |  |  |  |
| **email** | VARCHAR(255) |  |  |  |  |
| **create_at** | TIMESTAMP |  |  |  | `CURRENT_TIMESTAMP` |
| **update_at** | TIMESTAMP |  |  |  | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |

---

### テーブル定義: device

ユーザーに紐づくデバイス情報を管理するテーブルです。

| 物理名 (カラム名) | データ型 | NOT NULL | PK | FK | デフォルト値 / 属性 |
| --- | --- | --- | --- | --- | --- |
| **uuid** | VARCHAR(255) | 〇 | 〇 |  |  |
| **user_uuid** | VARCHAR(255) | 〇 |  | 〇 | `users(uuid)` を参照 |
| **name** | VARCHAR(255) | 〇 |  |  |  |
| **type** | VARCHAR(255) | 〇 |  |  |  |
| **status** | VARCHAR(255) | 〇 |  |  |  |
| **create_at** | TIMESTAMP |  |  |  | `CURRENT_TIMESTAMP` |
| **update_at** | TIMESTAMP |  |  |  | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |

---

### テーブル定義: sit_data

デバイスで検知した着座・滞在等の期間データを管理するテーブルです。

| 物理名 (カラム名) | データ型 | NOT NULL | PK | FK | デフォルト値 / 属性 |
| --- | --- | --- | --- | --- | --- |
| **uuid** | VARCHAR(255) | 〇 | 〇 |  |  |
| **device_uuid** | VARCHAR(255) | 〇 |  | 〇 | `device(uuid)` を参照 |
| **start_at** | TIMESTAMP |  |  |  | `CURRENT_TIMESTAMP` |
| **end_at** | TIMESTAMP |  |  |  | `NULL` |

---

### テーブル定義: activity_data

デバイスで検知したアクティビティ（行動）のログデータを管理するテーブルです。

| 物理名 (カラム名) | データ型 | NOT NULL | PK | FK | デフォルト値 / 属性 |
| --- | --- | --- | --- | --- | --- |
| **uuid** | VARCHAR(255) | 〇 | 〇 |  |  |
| **device_uuid** | VARCHAR(255) | 〇 |  | 〇 | `device(uuid)` を参照 |
| **type** | VARCHAR(255) | 〇 |  |  |  |
| **create_at** | TIMESTAMP |  |  |  | `CURRENT_TIMESTAMP` |