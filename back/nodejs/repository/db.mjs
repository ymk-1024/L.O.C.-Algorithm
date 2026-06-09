// [UPDATE] 接続プール管理のみに専念
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

let pool;

// MySQL コネクションプール初期化
export const initializePool = async () => {
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'mysql',
    port: process.env.MYSQL_PORT || 3307,
    user: process.env.MYSQL_USER || 'admin',
    password: process.env.MYSQL_PASSWORD || '114514',
    database: process.env.MYSQL_DATABASE || 'LOCDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log('MySQL connection pool initialized');
  return pool;
};

// コネクションプール取得
export const getPool = () => {
  if (!pool) throw new Error('Database pool not initialized');
  return pool;
};

export default { initializePool, getPool };
