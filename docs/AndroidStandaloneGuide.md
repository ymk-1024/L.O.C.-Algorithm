# Android単体で動作するAPKビルドおよびスタンドアロン動作化の手引書

本ドキュメントは、PC（開発サーバー/ローカルAPI）がない環境でも、AndroidスマートフォンにインストールしたAPK単体でアプリの全機能（画面表示、BLE連携、Wi-Fi設定、ダミーデータ動作など）が自律して動作するようにするための手順書です。

---

## 1. 現状PCが必要な理由とボトルネック

現在、アプリがPCなしで動作しない原因は以下の2点です。

1. **JavaScriptバンドルの依存 (Metro開発サーバー依存)**:
   - デバッグ用ビルド（`development` / `debug`）でビルドされたアプリは、起動時にPC上のMetro開発サーバー（ポート `8081`）に接続してJavaScriptコードをダウンロードします。PCがシャットダウンしていると、アプリ起動時に接続エラーとなり起動しません。
2. **APIサーバーの依存 (ローカルPC Docker依存)**:
   - アカウント情報や記録データの同期において、PC上で起動しているDockerコンテナ（MySQL/Node.js）へ `adb reverse` 経由（`127.0.0.1:3005`）で通信しています。PCがないと通信エラーになります。

---

## 2. 解決策のアプローチ

スマートフォン単体（PCなし）で正常動作させるため、以下の2つの対策を同時に実施します。

### 対策①：リリース（本番）ビルドによる自律APKの作成
Expoのリリースバリアントビルドを行い、JavaScriptコード（バンドル）をAPKファイル内部に完全に同梱（アセットコンパイル）します。これにより、**PC上のMetroサーバーが起動していなくても、アプリ単体で即座に起動する**ようになります。

### 対策②：APIエラー時の完全ローカルモックフォールバック（オフライン対応）
バックエンドAPIへの接続がタイムアウトまたは失敗した場合に、アプリがクラッシュしたり画面が白くなったりせず、**自動的にローカルの疑似データ（またはデバイス内で完結するストレージ）に切り替わって動作を継続する**ようにプログラムを改修します。
具体的には：
- [utils/api.js](file:///c:/シス開/L.O.C.-Algorithm/front/AwesomeProject/utils/api.js) でAPI疎通確認のヘルスチェックを事前に行うか、`fetch` 時の例外キャッチを徹底する。
- アカウント画面やスケジュール画面において、API接続失敗時はローカルの初期データ（モックデータ）をそのまま利用して表示・更新ができるようにフォールバック処理を実装する。

---

## 3. 具体的な作業手順

### ステップ 1: アプリコードの「オフライン・自律動作」対応
1. **API接続エラーのキャッチ強化**:
   - アカウント画面 (`Account.js`) 等で、API疎通エラー（`TypeError: Network request failed` 等）が発生した際に、画面にエラーで止まるのではなく、ローカルのデフォルトデータをステートに設定して続行する処理を確実に入れます。
2. **BLE/Wi-Fi動作の完全自律化**:
   - スケジュール画面 (`Schedule.js`) や Wi-Fi設定画面 (`WifiSettingScreen.js`) は、すでにフロントエンドの `useState` や `bleManager` の仮想（Virtual）モードにより、バックエンド未完成でも自律して動作するようになっています。このローカル制御を確実に有効化しておきます。

### ステップ 2: 日本語を含まないビルド用ディレクトリ (`C:\LOC-Build`) へのコード同期
Windows環境およびCMakeの制限を回避するため、最新コードを `C:\LOC-Build\front\AwesomeProject` にコピーします。

```powershell
# ワークスペースからビルド環境へ最新コードを同期 (PowerShell)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
robocopy "c:\シス開\L.O.C.-Algorithm\front\AwesomeProject" "C:\LOC-Build\front\AwesomeProject" /MIR /XD node_modules .expo android/build android/app/build
```

### ステップ 3: リリースAPKのビルド実行
ビルド環境 (`C:\LOC-Build\front\AwesomeProject`) にて、リリースバリアントのビルドを行います。これにより、PCとの通信を必要としない独立したAPKが生成されます。

```powershell
# 1. ビルド環境ディレクトリに移動 (Cwd: C:\LOC-Build\front\AwesomeProject)
# 2. リリリースバリアントのビルドおよび実機転送を実行
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr";
$env:Path="C:\Users\matty\AppData\Local\Android\Sdk\platform-tools;" + $env:Path;
npx expo run:android --variant release
```

- **`--variant release`**: このオプションを付与することで、Metroデバッグ用の開発サーバーを参照しない本番用コードがコンパイルされ、JSバンドルがAPKに同梱されます。
- **実機へのインストール**: ビルド完了後、USBデバッグ経由でAndroidスマートフォンへ自律動作するAPKがインストールされます。

---

## 4. ビルドされた単体APKの取り出し・共有方法

他のスマートフォンへAPKをインストールしたい場合、ビルドによって生成された実ファイルを取り出して共有できます。

- **生成されるAPKの場所**:
  [C:\LOC-Build\front\AwesomeProject\android\app\build\outputs\apk\release\app-release.apk](file:///C:/LOC-Build/front/AwesomeProject/android/app/build/outputs/apk/release/app-release.apk)
- **共有手順**:
  1. 上記パスにある `app-release.apk` ファイルを、Googleドライブ、メール、またはSlack等でスマートフォンに送信します。
  2. スマートフォン側でAPKファイルを開き、「不明なアプリのインストール」を許可してインストールします。
  3. PCがなくても、完全にスマホ単体でアプリが自律動作します。
