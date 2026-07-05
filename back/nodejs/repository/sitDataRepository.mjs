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

export const updateSitData = async (uuid, deviceUuid, endAt = null) => {
  await query(
    'UPDATE sit_data SET device_uuid = ?, end_at = ? WHERE uuid = ?',
    [deviceUuid, endAt, uuid]
  );
  return { uuid, deviceUuid, endAt };
};

export const deleteSitData = async (uuid) => {
  await query('DELETE FROM sit_data WHERE uuid = ?', [uuid]);
};

export const getLatestSitDataByDevice = async (deviceUuid) => {
  const results = await query(
    'SELECT uuid, device_uuid, start_at, end_at FROM sit_data WHERE device_uuid = ? ORDER BY start_at DESC LIMIT 1',
    [deviceUuid]
  );
  return results.length > 0 ? results[0] : null;
};

export default { getAllSitData, getSitDataById, createSitData, updateSitData, deleteSitData, getLatestSitDataByDevice };