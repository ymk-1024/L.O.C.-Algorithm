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

// ユーザーの全スケジュールを取得
export const getSchedulesByUserUuid = async (userUuid) => {
  return await query(
    'SELECT uuid, user_uuid, title, day_of_week, start_time, end_time, is_active, create_at, update_at FROM schedule WHERE user_uuid = ? ORDER BY day_of_week, start_time',
    [userUuid]
  );
};

// UUID でスケジュールを1件取得
export const getScheduleByUuid = async (uuid) => {
  const results = await query(
    'SELECT uuid, user_uuid, title, day_of_week, start_time, end_time, is_active, create_at, update_at FROM schedule WHERE uuid = ?',
    [uuid]
  );
  return results.length > 0 ? results[0] : null;
};

// スケジュールを作成
export const createSchedule = async (uuid, userUuid, title, dayOfWeek, startTime, endTime) => {
  await query(
    'INSERT INTO schedule (uuid, user_uuid, title, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
    [uuid, userUuid, title, dayOfWeek, startTime, endTime]
  );
  return { uuid, userUuid, title, dayOfWeek, startTime, endTime, isActive: true };
};

// スケジュールを更新
export const updateSchedule = async (uuid, title, dayOfWeek, startTime, endTime, isActive) => {
  await query(
    'UPDATE schedule SET title = ?, day_of_week = ?, start_time = ?, end_time = ?, is_active = ? WHERE uuid = ?',
    [title, dayOfWeek, startTime, endTime, isActive, uuid]
  );
  return { uuid, title, dayOfWeek, startTime, endTime, isActive };
};

// スケジュールを削除
export const deleteSchedule = async (uuid) => {
  await query('DELETE FROM schedule WHERE uuid = ?', [uuid]);
};

export default {
  getSchedulesByUserUuid,
  getScheduleByUuid,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
