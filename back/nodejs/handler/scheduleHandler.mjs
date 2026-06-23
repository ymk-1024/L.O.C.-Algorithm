import scheduleService from '../service/scheduleService.mjs';
import xss from 'xss';

const sanitize = (value) => (typeof value === 'string' ? xss(value) : value);

// ユーザーの全スケジュールを取得
const getSchedules = async (req, res, next) => {
  try {
    const userUuid = req.user_uuid; // autoRefreshAuth が付与
    const result = await scheduleService.getSchedules(userUuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// スケジュールを1件取得
const getScheduleById = async (req, res, next) => {
  try {
    const userUuid = req.user_uuid;
    const uuid = sanitize(req.params.uuid);
    const result = await scheduleService.getScheduleById(uuid, userUuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// スケジュールを作成
const createSchedule = async (req, res, next) => {
  try {
    const userUuid  = req.user_uuid;
    const title     = sanitize(req.body.title);
    const dayOfWeek = req.body.day_of_week;
    const startTime = sanitize(req.body.start_time);
    const endTime   = sanitize(req.body.end_time);

    const result = await scheduleService.createSchedule(userUuid, title, dayOfWeek, startTime, endTime);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// スケジュールを更新
const updateSchedule = async (req, res, next) => {
  try {
    const userUuid  = req.user_uuid;
    const uuid      = sanitize(req.params.uuid);
    const title     = req.body.title     !== undefined ? sanitize(req.body.title)     : undefined;
    const dayOfWeek = req.body.day_of_week;
    const startTime = req.body.start_time !== undefined ? sanitize(req.body.start_time) : undefined;
    const endTime   = req.body.end_time   !== undefined ? sanitize(req.body.end_time)   : undefined;
    const isActive  = req.body.is_active;

    const result = await scheduleService.updateSchedule(uuid, userUuid, title, dayOfWeek, startTime, endTime, isActive);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// スケジュールを削除
const deleteSchedule = async (req, res, next) => {
  try {
    const userUuid = req.user_uuid;
    const uuid = sanitize(req.params.uuid);
    const result = await scheduleService.deleteSchedule(uuid, userUuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
