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

export const getAllActivityData = async () => {
  return await query(
    'SELECT uuid, device_uuid, type, create_at FROM activity_data',
    []
  );
};

export const getActivityDataById = async (uuid) => {
  const results = await query(
    'SELECT uuid, device_uuid, type, create_at FROM activity_data WHERE uuid = ?',
    [uuid]
  );
  return results.length > 0 ? results[0] : null;
};

export const createActivityData = async (uuid, deviceUuid, type) => {
  await query(
    'INSERT INTO activity_data (uuid, device_uuid, type) VALUES (?, ?, ?)',
    [uuid, deviceUuid, type]
  );
  return { uuid, deviceUuid, type };
};

export default { getAllActivityData, getActivityDataById, createActivityData };