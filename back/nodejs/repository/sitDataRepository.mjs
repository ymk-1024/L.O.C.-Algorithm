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

export const getAllSitData = async () => {
  return await query(
    'SELECT uuid, device_uuid, start_at, end_at FROM sit_data',
    []
  );
};

export const getSitDataById = async (uuid) => {
  const results = await query(
    'SELECT uuid, device_uuid, start_at, end_at FROM sit_data WHERE uuid = ?',
    [uuid]
  );
  return results.length > 0 ? results[0] : null;
};

export const createSitData = async (uuid, deviceUuid, endAt = null) => {
  await query(
    'INSERT INTO sit_data (uuid, device_uuid, end_at) VALUES (?, ?, ?)',
    [uuid, deviceUuid, endAt]
  );
  return { uuid, deviceUuid, endAt };
};

export default { getAllSitData, getSitDataById, createSitData };