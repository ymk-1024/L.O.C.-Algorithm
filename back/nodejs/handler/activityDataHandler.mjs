import activityDataService from '../service/activityDataService.mjs';
import xss from 'xss';

const sanitize = (value) => (typeof value === 'string' ? xss(value) : value);

const getAllActivityData = async (req, res, next) => {
  try {
    const result = await activityDataService.getAllActivityData();
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const getActivityDataById = async (req, res, next) => {
  try {
    const uuid = sanitize(req.params.uuid);
    const result = await activityDataService.getActivityDataById(uuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const createActivityData = async (req, res, next) => {
  try {
    const deviceUuid = sanitize(req.body.deviceUuid);
    const type = sanitize(req.body.type);
    const result = await activityDataService.createActivityData(deviceUuid, type);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteActivityData = async (req, res, next) => {
  try {
    const uuid = sanitize(req.params.uuid);
    const result = await activityDataService.deleteActivityData(uuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllActivityData,
  getActivityDataById,
  createActivityData,
  deleteActivityData,
};