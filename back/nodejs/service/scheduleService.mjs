import scheduleRepository from '../repository/scheduleRepository.mjs';
import { v7 as uuidV7 } from 'uuid';

// day_of_week は 0(日)〜6(土) の整数
const VALID_DAYS = [0, 1, 2, 3, 4, 5, 6];

const scheduleService = {

  // ユーザーの全スケジュールを取得
  getSchedules: async (userUuid) => {
    try {
      const schedules = await scheduleRepository.getSchedulesByUserUuid(userUuid);
      return { status: 200, data: schedules };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // スケジュールを1件取得（所有者チェック付き）
  getScheduleById: async (uuid, userUuid) => {
    try {
      const schedule = await scheduleRepository.getScheduleByUuid(uuid);
      if (!schedule) {
        return { status: 404, message: 'スケジュールが見つかりません。' };
      }
      if (schedule.user_uuid !== userUuid) {
        return { status: 403, message: 'このスケジュールへのアクセス権がありません。' };
      }
      return { status: 200, data: schedule };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // スケジュールを作成
  createSchedule: async (userUuid, title, dayOfWeek, startTime, endTime) => {
    try {
      // バリデーション
      if (!title || title.trim() === '') {
        return { status: 400, message: 'title は必須です。' };
      }
      if (!VALID_DAYS.includes(Number(dayOfWeek))) {
        return { status: 400, message: 'day_of_week は 0(日)〜6(土) の整数で指定してください。' };
      }
      if (!startTime || !endTime) {
        return { status: 400, message: 'start_time と end_time は必須です。（HH:MM 形式）' };
      }

      const uuid = uuidV7();
      const schedule = await scheduleRepository.createSchedule(
        uuid, userUuid, title.trim(), Number(dayOfWeek), startTime, endTime
      );

      return {
        status: 201,
        message: 'スケジュールを登録しました。',
        data: schedule,
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // スケジュールを更新（所有者チェック付き）
  updateSchedule: async (uuid, userUuid, title, dayOfWeek, startTime, endTime, isActive) => {
    try {
      const existing = await scheduleRepository.getScheduleByUuid(uuid);
      if (!existing) {
        return { status: 404, message: 'スケジュールが見つかりません。' };
      }
      if (existing.user_uuid !== userUuid) {
        return { status: 403, message: 'このスケジュールを編集する権限がありません。' };
      }

      // 未指定の場合は既存値を使用
      const nextTitle     = title      !== undefined ? title.trim()          : existing.title;
      const nextDay       = dayOfWeek  !== undefined ? Number(dayOfWeek)     : existing.day_of_week;
      const nextStartTime = startTime  !== undefined ? startTime             : existing.start_time;
      const nextEndTime   = endTime    !== undefined ? endTime               : existing.end_time;
      const nextIsActive  = isActive   !== undefined ? Boolean(isActive)     : Boolean(existing.is_active);

      if (dayOfWeek !== undefined && !VALID_DAYS.includes(nextDay)) {
        return { status: 400, message: 'day_of_week は 0(日)〜6(土) の整数で指定してください。' };
      }

      const updated = await scheduleRepository.updateSchedule(
        uuid, nextTitle, nextDay, nextStartTime, nextEndTime, nextIsActive
      );

      return {
        status: 200,
        message: 'スケジュールを更新しました。',
        data: updated,
      };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },

  // スケジュールを削除（所有者チェック付き）
  deleteSchedule: async (uuid, userUuid) => {
    try {
      const existing = await scheduleRepository.getScheduleByUuid(uuid);
      if (!existing) {
        return { status: 404, message: 'スケジュールが見つかりません。' };
      }
      if (existing.user_uuid !== userUuid) {
        return { status: 403, message: 'このスケジュールを削除する権限がありません。' };
      }
      await scheduleRepository.deleteSchedule(uuid);
      return { status: 200, message: 'スケジュールを削除しました。' };
    } catch (error) {
      throw new Error(`DB Error: ${error.message}`);
    }
  },
};

export default scheduleService;
