# Nomad ZIP デプロイスクリプト (PowerShell)
# 使い方: Powershell.exe -ExecutionPolicy Bypass -File .\deploy.ps1

$ErrorActionPreference = "Stop"

# 1. 開発PCのIPアドレス（Nomadクライアントから接続可能なIP）を自動取得
Write-Host "[Deploy] ローカルIPアドレスを取得中..."
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.InterfaceAlias -notlike "*Loopback*"
} | Select-Object -First 1).IPAddress

if (-not $localIp) {
    $localIp = "127.0.0.1"
    Write-Warning "[Deploy] 有効なローカルIPが見つかりませんでした。127.0.0.1 を使用します。"
}
Write-Host "[Deploy] 検出されたローカルIP: $localIp"

# 2. ソースコードのZIP圧縮
Write-Host "[Deploy] ソースコードをZIP圧縮中 (loc-api.zip)..."
$srcDir = Join-Path $PSScriptRoot "nodejs"
$zipPath = Join-Path $PSScriptRoot "loc-api.zip"

# 古いZIPがあれば削除
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# 圧縮処理 (node_modulesも含めて丸ごと圧縮)
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($srcDir, $zipPath)
Write-Host "[Deploy] ZIP圧縮完了: $zipPath"

# 3. .env ファイルから MySQL 設定を読み込み
Write-Host "[Deploy] .env ファイルから環境変数をパース中..."
$envPath = Join-Path $PSScriptRoot ".env"
$mysqlHost = "127.0.0.1"
$mysqlPort = "3306"
$mysqlUser = "admin"
$mysqlPassword = "114514"
$mysqlDatabase = "LOCDB"

if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            if ($line -match "^([^=]+)=(.*)$") {
                $key = $Matches[1].Trim()
                $val = $Matches[2].Trim()
                # ダブルクォーテーションやシングルクォーテーションを除去
                $val = $val -replace "^['`"]|['`"]$"
                switch ($key) {
                    "MYSQL_PORT" { $mysqlPort = $val }
                    "MYSQL_USER" { $mysqlUser = $val }
                    "MYSQL_PASSWORD" { $mysqlPassword = $val }
                    "MYSQL_DATABASE" { $mysqlDatabase = $val }
                }
            }
        }
    }
}

# 4. 一時的な HTTP サーバーを起動して ZIP を配信
Write-Host "[Deploy] 一時HTTPサーバーをポート 8080 で起動中..."
$httpProcess = Start-Process npx -ArgumentList "http-server", "-p", "8080", "--cors" -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden

# サーバー起動を少し待つ
Start-Sleep -Seconds 3

# 5. Nomad へジョブを送信
Write-Host "[Deploy] Nomadジョブを送信中..."
$nomadJobPath = Join-Path $PSScriptRoot "loc-api.nomad"

try {
    # nomad CLI が利用可能な場合はコマンド実行、無ければREST APIを試みる
    if (Get-Command nomad -ErrorAction SilentlyContinue) {
        nomad job run `
          -var "deploy_host=$localIp" `
          -var "mysql_host=$mysqlHost" `
          -var "mysql_port=$mysqlPort" `
          -var "mysql_user=$mysqlUser" `
          -var "mysql_password=$mysqlPassword" `
          -var "mysql_database=$mysqlDatabase" `
          $nomadJobPath
    } else {
        Write-Warning "[Deploy] nomad CLI が見つかりません。HTTP API 経由でデプロイを試みます。"
        # Nomad REST API (/v1/jobs) を叩くためにジョブファイルをJSON形式でパースして投げる処理
        # 通常は CLI が入っている想定ですが、fallback 警告を出します
        Write-Error "nomad CLI がシステムにインストールされていないため、自動デプロイを完了できません。Nomad CLI を PATH に追加してください。"
    }
}
finally {
    # 6. NomadがZIPをダウンロードする時間を考慮して待機後、HTTPサーバーを停止
    Write-Host "[Deploy] Nomadによるダウンロード完了を待機中 (10秒)..."
    Start-Sleep -Seconds 10
    
    Write-Host "[Deploy] 一時HTTPサーバーを停止しています..."
    if ($httpProcess -and -not $httpProcess.HasExited) {
        Stop-Process -Id $httpProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    # 一時ZIPファイルのクリーンアップ
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    Write-Host "[Deploy] デプロイ処理が終了しました。"
}
