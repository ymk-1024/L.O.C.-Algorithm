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

const updateDevice = async (req, res, next) => {
  try {
    const uuid   = sanitize(req.params.uuid);
    const name   = sanitize(req.body.name);
    const type   = sanitize(req.body.type);
    const status = sanitize(req.body.status);

    const result = await deviceService.updateDevice(uuid, name, type, status);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteDevice = async (req, res, next) => {
  try {
    const uuid = sanitize(req.params.uuid);
    const result = await deviceService.deleteDevice(uuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// ① App → サーバー: OwnerToken 発行申請（ユーザーJWT認証必要）
const issueOwnerToken = async (req, res, next) => {
  try {
    const userUuid   = req.user_uuid; // autoRefreshAuth が付与
    const deviceUuid = sanitize(req.body.deviceUuid);
    const name       = sanitize(req.body.name) || 'Unknown Device';

    if (!deviceUuid) {
      return res.status(400).json({ status: 400, message: 'deviceUuid は必須です。' });
    }

    const result = await deviceService.issueOwnerToken(userUuid, deviceUuid, name);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// ② デバイス → サーバー: 自己登録（OwnerToken認証必要）
const selfRegister = async (req, res, next) => {
  try {
    const token = req.owner_token; // ownerTokenMiddleware が付与
    const model = sanitize(req.body.model);

    const result = await deviceService.selfRegister(token, model);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// ③ デバイス → サーバー: OwnerToken 更新（OwnerToken認証必要）
const refreshOwnerToken = async (req, res, next) => {
  try {
    const token  = req.owner_token; // ownerTokenMiddleware が付与
    const result = await deviceService.refreshOwnerToken(token);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  issueOwnerToken,
  selfRegister,
  refreshOwnerToken,
};