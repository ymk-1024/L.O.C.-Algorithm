import { Router } from 'express';
import activityDataHandler from '../handler/activityDataHandler.mjs';
import { validateActivityDataCreation } from '../middleware/validationMiddleware.mjs';
import authMiddleware from '../middleware/authMiddleware.mjs';

const activityData = Router();

// 読み取り系：認証不要
activityData.get('/', activityDataHandler.getAllActivityData);
activityData.get('/:uuid', activityDataHandler.getActivityDataById);

// 書き込み系：JWT 認証必須
activityData.post('/',        authMiddleware.autoRefreshAuth, validateActivityDataCreation, activityDataHandler.createActivityData);
activityData.delete('/:uuid', authMiddleware.autoRefreshAuth, activityDataHandler.deleteActivityData);

export default activityData;
