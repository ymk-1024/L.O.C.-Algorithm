// [UPDATE] 接続プール管理のみに専念
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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
    multipleStatements: true,
  });
  console.log('MySQL connection pool initialized');
  return pool;
};

// データベースマイグレーションの自動実行
export const runMigrations = async () => {
  if (!pool) throw new Error('Database pool not initialized');
  
  const connection = await pool.getConnection();
  try {
    // 1. マイグレーション履歴管理用テーブルの作成
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`migration_history\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`filename\` VARCHAR(255) NOT NULL UNIQUE,
        \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. マイグレーションディレクトリの確保
    const migrationsDir = path.resolve(__dirname, '..', '..', 'tables', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // 初回のみ：もしマイグレーションフォルダが空なら、database.sqlをコピーして 0001_init.sql を作成する
    let files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    if (files.length === 0) {
      const dbSqlPath = path.resolve(__dirname, '..', '..', 'tables', 'database.sql');
      if (fs.existsSync(dbSqlPath)) {
        const initDest = path.join(migrationsDir, '0001_init.sql');
        fs.copyFileSync(dbSqlPath, initDest);
        files.push('0001_init.sql');
        console.log('Copied database.sql to migrations/0001_init.sql as the initial migration.');
      }
    }

    // 3. 実行済みのマイグレーションを取得
    const [rows] = await connection.query('SELECT filename FROM migration_history');
    const executed = new Set(rows.map(r => r.filename));

    // 4. 未実行のマイグレーションを実行
    for (const file of files) {
      if (!executed.has(file)) {
        console.log(`Running migration: ${file}`);
        const sqlPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // SQL実行
        await connection.query(sql);

        // 履歴への書き込み
        await connection.query('INSERT INTO migration_history (filename) VALUES (?)', [file]);
        console.log(`Migration ${file} executed successfully.`);
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// コネクションプール取得
export const getPool = () => {
  if (!pool) throw new Error('Database pool not initialized');
  return pool;
};

export default { initializePool, runMigrations, getPool };
