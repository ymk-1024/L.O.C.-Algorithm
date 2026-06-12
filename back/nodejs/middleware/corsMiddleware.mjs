// [NEW] CORS ミドルウェア設定
import cors from 'cors';

const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
};

export default cors(corsOptions);
