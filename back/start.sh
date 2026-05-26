#!/bin/bash
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "[1/2] Dockerイメージをビルド中..."
docker compose up -d --build

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] 起動に失敗しました"
    exit 1
fi

echo ""
echo "[2/2] 起動成功！"