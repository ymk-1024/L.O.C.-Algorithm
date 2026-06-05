@echo off
chcp 65001
cd /d "%~dp0"

echo [1/2] Dockerイメージをビルド中...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 起動に失敗しました
    pause
    exit /b 1
)

echo.
echo [2/2] 起動成功！
pause