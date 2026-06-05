@echo off
chcp 65001
cd /d "%~dp0"

echo コンテナを停止中...
docker compose down

echo 停止しました
pause