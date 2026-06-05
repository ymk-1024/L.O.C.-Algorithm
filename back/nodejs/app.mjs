import express from 'express';
import dotenv from 'dotenv';
import routes from './router/index.mjs';
// [NEW] MySQL データベース接続管理
import db from './repository/db.mjs';
// [NEW] CORS ミドルウェア
import corsMiddleware from './middleware/corsMiddleware.mjs';
// [NEW] エラーハンドリング
import { errorHandler, notFoundHandler } from './middleware/errorHandler.mjs';
// [NEW] 検証・サニタイズミドルウェア
import { requestLogger, sanitizeBody } from './middleware/validationMiddleware.mjs';

dotenv.config();

const app = express();
const port = process.env.NODE_PORT || 3000;

// [NEW] MySQL コネクションプール初期化
await db.initializePool();

// [NEW] ミドルウェアチェーン
app.use(requestLogger);       // リクエストログ
app.use(corsMiddleware);       // CORS 有効化
app.use(express.json());       // JSON パース
app.use(sanitizeBody);         // XSS サニタイズ

app.get('/', (req, res) => {
  res.send('API is running');
});

app.use("/api", routes);

// [NEW] エラーハンドリング
app.use(notFoundHandler);      // 404 処理
app.use(errorHandler);         // グローバルエラー処理

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
