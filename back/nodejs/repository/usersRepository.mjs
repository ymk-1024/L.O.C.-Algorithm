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

// UUID でユーザー取得（password は含まない - 外部返却用）
export const getUserById = async (uuid) => {
  const results = await query('SELECT uuid, username, email, create_at, update_at FROM users WHERE uuid = ?', [uuid]);
  return results.length > 0 ? results[0] : null;
};

// UUID でユーザー取得（password を含む - 内部処理用）
export const getUserWithPasswordById = async (uuid) => {
  const results = await query('SELECT uuid, username, password, email, create_at, update_at FROM users WHERE uuid = ?', [uuid]);
  return results.length > 0 ? results[0] : null;
};

export const findUserByEmailOrUsername = async (identifier) => {
  const results = await query(
    'SELECT uuid, username, email, password, create_at, update_at FROM users WHERE email = ? OR username = ? LIMIT 1',
    [identifier, identifier]
  );
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

// ユーザー更新
export const updateUser = async (uuid, username, password, email) => {
  await query(
    'UPDATE users SET username = ?, password = ?, email = ?, update_at = CURRENT_TIMESTAMP WHERE uuid = ?',
    [username, password, email, uuid]
  );
  return { uuid, username, email };
};

// ユーザー削除
export const deleteUser = async (uuid) => {
  await query('DELETE FROM users WHERE uuid = ?', [uuid]);
};

// ユーザー設定取得
export const getUserSettings = async (uuid) => {
  const results = await query(
    'SELECT reminder_interval_minutes, daily_stand_goal, sensor_sensitivity FROM users WHERE uuid = ?',
    [uuid]
  );
  return results.length > 0 ? results[0] : null;
};

// ユーザー設定更新
export const updateUserSettings = async (uuid, reminderIntervalMinutes, dailyStandGoal, sensorSensitivity) => {
  await query(
    'UPDATE users SET reminder_interval_minutes = ?, daily_stand_goal = ?, sensor_sensitivity = ?, update_at = CURRENT_TIMESTAMP WHERE uuid = ?',
    [reminderIntervalMinutes, dailyStandGoal, sensorSensitivity, uuid]
  );
  return { uuid, reminderIntervalMinutes, dailyStandGoal, sensorSensitivity };
};

export default { getAllUsers, getUserById, getUserWithPasswordById, findUserByEmailOrUsername, createUser, updateUser, deleteUser, getUserSettings, updateUserSettings };
