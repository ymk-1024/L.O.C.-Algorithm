import deviceService from '../service/deviceService.mjs';
import xss from 'xss';

const sanitize = (value) => (typeof value === 'string' ? xss(value) : value);

const getAllDevices = async (req, res, next) => {
  try {
    const result = await deviceService.getAllDevices();
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const getDeviceById = async (req, res, next) => {
  try {
    const uuid = sanitize(req.params.uuid);
    const result = await deviceService.getDeviceById(uuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const createDevice = async (req, res, next) => {
  try {
    const userUuid = sanitize(req.body.userUuid);
    const name = sanitize(req.body.name);
    const type = sanitize(req.body.type);
    const status = sanitize(req.body.status);

    const result = await deviceService.createDevice(userUuid, name, type, status);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllDevices,
  getDeviceById,
  createDevice,
};