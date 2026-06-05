import { Router } from 'express';
import activityDataHandler from '../handler/activityDataHandler.mjs';
import { validateActivityDataCreation } from '../middleware/validationMiddleware.mjs';

const activityData = Router();

activityData.get('/', activityDataHandler.getAllActivityData);
activityData.get('/:uuid', activityDataHandler.getActivityDataById);
activityData.post('/', validateActivityDataCreation, activityDataHandler.createActivityData);

export default activityData;
