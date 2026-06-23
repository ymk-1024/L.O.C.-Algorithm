import { Router } from 'express';
import scheduleHandler from '../handler/scheduleHandler.mjs';
import authMiddleware from '../middleware/authMiddleware.mjs';

const schedule = Router();

// 全エンドポイントにログイン必須
schedule.get('/',        authMiddleware.autoRefreshAuth, scheduleHandler.getSchedules);
schedule.get('/:uuid',   authMiddleware.autoRefreshAuth, scheduleHandler.getScheduleById);
schedule.post('/',       authMiddleware.autoRefreshAuth, scheduleHandler.createSchedule);
schedule.put('/:uuid',   authMiddleware.autoRefreshAuth, scheduleHandler.updateSchedule);
schedule.delete('/:uuid', authMiddleware.autoRefreshAuth, scheduleHandler.deleteSchedule);

export default schedule;
