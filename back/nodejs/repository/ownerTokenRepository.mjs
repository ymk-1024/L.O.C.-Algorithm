import db from './db.mjs';

const query = async (sql, values) => {
  const connection = await db.getPool().getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
};

// OwnerToken を発行・保存（発行時点では device_uuid は不明なので NULL）
export const createOwnerToken = async (userUuid, name, token, expiresAt) => {
  await query(
    'INSERT INTO owner_tokens (user_uuid, name, token, expires_at) VALUES (?, ?, ?, ?)',
    [userUuid, name, token, expiresAt]
  );
  return { userUuid, name, token, expiresAt };
};

// token 文字列でレコード取得（有効性確認・自己登録用）
export const getOwnerTokenByToken = async (token) => {
  const results = await query(
    'SELECT * FROM owner_tokens WHERE token = ? LIMIT 1',
    [token]
  );
  return results.length > 0 ? results[0] : null;
};

// device_uuid でレコード取得（更新・重複確認用）
export const getOwnerTokenByDeviceUuid = async (deviceUuid) => {
  const results = await query(
    'SELECT * FROM owner_tokens WHERE device_uuid = ? LIMIT 1',
    [deviceUuid]
  );
  return results.length > 0 ? results[0] : null;
};

// 自己登録完了時にデバイスUUIDを紐づける
export const assignDeviceToToken = async (token, deviceUuid) => {
  await query(
    'UPDATE owner_tokens SET device_uuid = ? WHERE token = ?',
    [deviceUuid, token]
  );
};

// トークン更新（ローテーション）
export const updateOwnerToken = async (deviceUuid, newToken, expiresAt) => {
  await query(
    'UPDATE owner_tokens SET token = ?, expires_at = ? WHERE device_uuid = ?',
    [newToken, expiresAt, deviceUuid]
  );
  return { deviceUuid, newToken, expiresAt };
};

// OwnerToken 削除（デバイス削除時など）
export const deleteOwnerTokenByDeviceUuid = async (deviceUuid) => {
  await query('DELETE FROM owner_tokens WHERE device_uuid = ?', [deviceUuid]);
};

export default {
  createOwnerToken,
  getOwnerTokenByToken,
  getOwnerTokenByDeviceUuid,
  assignDeviceToToken,
  updateOwnerToken,
  deleteOwnerTokenByDeviceUuid,
};
