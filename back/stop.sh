#!/bin/bash
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "コンテナを停止中..."
docker compose down

echo "停止しました"