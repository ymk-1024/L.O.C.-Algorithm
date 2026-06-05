// [NEW] Users テーブル操作専用リポジトリ
import db from './db.mjs';

// 汎用クエリ実行
const query = async (sql, values) => {
  const connection = await db.getPool().getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
};

// 全ユーザー取得
export const getAllUsers = async () => {
  return await query('SELECT uuid, username, email, create_at, update_at FROM users', []);
};

// UUID でユーザー取得
export const getUserById = async (uuid) => {
  const results = await query('SELECT uuid, username, email, create_at, update_at FROM users WHERE uuid = ?', [uuid]);
  return results.length > 0 ? results[0] : null;
};

// ユーザー作成
export const createUser = async (uuid, username, password, email) => {
  await query(
    'INSERT INTO users (uuid, username, password, email) VALUES (?, ?, ?, ?)',
    [uuid, username, password, email]
  );
  return { uuid, username, email };
};

export default { getAllUsers, getUserById, createUser };
