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

// Pending なコマンドを取得する
export const getPendingCommands = async (deviceUuid) => {
  return await query(
    'SELECT id, device_uuid, command_type, payload, status, create_at, update_at FROM device_commands WHERE device_uuid = ? AND status = "pending" ORDER BY create_at ASC',
    [deviceUuid]
  );
};

// コマンドを1件取得
export const getCommandById = async (id, deviceUuid) => {
  const results = await query(
    'SELECT id, device_uuid, command_type, payload, status, create_at, update_at FROM device_commands WHERE id = ? AND device_uuid = ?',
    [id, deviceUuid]
  );
  return results.length > 0 ? results[0] : null;
};

// コマンドのステータスを更新 (ACK用など)
export const updateCommandStatus = async (id, deviceUuid, status) => {
  await query(
    'UPDATE device_commands SET status = ? WHERE id = ? AND device_uuid = ?',
    [status, id, deviceUuid]
  );
};

// ping記録
export const updateLastPing = async (deviceUuid) => {
  await query('UPDATE device SET last_ping_at = CURRENT_TIMESTAMP WHERE uuid = ?', [deviceUuid]);
};

// デバイスステータスログの追加
export const insertDeviceStatusLog = async (deviceUuid, batteryLevel, isSitting, otherStatus) => {
  const payloadStr = otherStatus ? JSON.stringify(otherStatus) : null;
  await query(
    'INSERT INTO device_status_log (device_uuid, battery_level, is_sitting, other_status) VALUES (?, ?, ?, ?)',
    [deviceUuid, batteryLevel !== undefined ? batteryLevel : null, isSitting ? 1 : 0, payloadStr]
  );
};

// スケジュールの時間内かどうかの判定用：特定の曜日のアクティブなスケジュールを取得
export const getActiveSchedulesByDay = async (userUuid, dayOfWeek) => {
  return await query(
    'SELECT start_time, end_time FROM schedule WHERE user_uuid = ? AND day_of_week = ? AND is_active = 1',
    [userUuid, dayOfWeek]
  );
};

// デバイスへのコマンド追加
export const insertCommand = async (deviceUuid, commandType, payload) => {
  const payloadStr = typeof payload === 'object' ? JSON.stringify(payload) : payload;
  await query(
    'INSERT INTO device_commands (device_uuid, command_type, payload, status) VALUES (?, ?, ?, "pending")',
    [deviceUuid, commandType, payloadStr]
  );
};

// 特定の種類の最新コマンドを取得
export const getLatestCommandByType = async (deviceUuid, commandType) => {
  const results = await query(
    'SELECT id, device_uuid, command_type, payload, status, create_at, update_at FROM device_commands WHERE device_uuid = ? AND command_type = ? ORDER BY create_at DESC LIMIT 1',
    [deviceUuid, commandType]
  );
  return results.length > 0 ? results[0] : null;
};

export default {
  getPendingCommands,
  getCommandById,
  updateCommandStatus,
  updateLastPing,
  insertDeviceStatusLog,
  getActiveSchedulesByDay,
  insertCommand,
  getLatestCommandByType,
};
