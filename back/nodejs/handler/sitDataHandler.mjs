import sitDataService from '../service/sitDataService.mjs';
import xss from 'xss';

const sanitize = (value) => (typeof value === 'string' ? xss(value) : value);

const getAllSitData = async (req, res, next) => {
  try {
    const result = await sitDataService.getAllSitData();
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const getSitDataById = async (req, res, next) => {
  try {
    const uuid = sanitize(req.params.uuid);
    const result = await sitDataService.getSitDataById(uuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const createSitData = async (req, res, next) => {
  try {
    const deviceUuid = sanitize(req.body.deviceUuid);
    const endAt = sanitize(req.body.endAt);
    const result = await sitDataService.createSitData(deviceUuid, endAt);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllSitData,
  getSitDataById,
  createSitData,
};