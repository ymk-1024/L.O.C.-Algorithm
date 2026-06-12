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
  const isProductionRuntime = process.env.NODE_ENV === 'production';
  const envHost = process.env.MYSQL_HOST;
  const configuredHost = (!isProductionRuntime && envHost === 'mysql')
    ? '127.0.0.1'
    : (envHost || (isProductionRuntime ? 'mysql' : '127.0.0.1'));
  const configuredPort = Number(process.env.MYSQL_PORT || (configuredHost === '127.0.0.1' ? 3307 : 3306));

  pool = mysql.createPool({
    host: configuredHost,
    port: configuredPort,
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
