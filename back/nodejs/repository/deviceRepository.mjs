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

export const getAllDevices = async () => {
  return await query(
    'SELECT uuid, user_uuid, name, type, status, create_at, update_at FROM device',
    []
  );
};

export const getDeviceById = async (uuid) => {
  const results = await query(
    'SELECT uuid, user_uuid, name, type, status, create_at, update_at FROM device WHERE uuid = ?',
    [uuid]
  );
  return results.length > 0 ? results[0] : null;
};

export const createDevice = async (uuid, userUuid, name, type, status) => {
  await query(
    'INSERT INTO device (uuid, user_uuid, name, type, status) VALUES (?, ?, ?, ?, ?)',
    [uuid, userUuid, name, type, status]
  );
  return { uuid, userUuid, name, type, status };
};

export default { getAllDevices, getDeviceById, createDevice };