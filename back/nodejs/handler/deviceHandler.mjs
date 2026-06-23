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
    const userUuid = req.user_uuid; // autoRefreshAuth が付与
    const name     = sanitize(req.body.name) || 'Unknown Device';

    const result = await deviceService.issueOwnerToken(userUuid, name);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// ② デバイス → サーバー: 自己登録（OwnerToken認証必要）
// デバイスが自分で生成した uuid を body で送る
const selfRegister = async (req, res, next) => {
  try {
    const token      = req.owner_token;              // ownerTokenMiddleware が付与
    const deviceUuid = sanitize(req.body.uuid);      // デバイスが自分で生成したUUID
    const model      = sanitize(req.body.model);

    if (!deviceUuid) {
      return res.status(400).json({ status: 400, message: 'uuid は必須です（デバイスが自分で生成したUUIDを送信してください）。' });
    }

    const result = await deviceService.selfRegister(token, deviceUuid, model);
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

// ④ デバイス → サーバー: ポーリング用
const polling = async (req, res, next) => {
  try {
    const deviceUuid = req.device_uuid;
    const userUuid = req.user_uuid;
    const isSitting = req.query.is_sitting === 'true';

    const result = await deviceService.polling(deviceUuid, userUuid, isSitting);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// ⑤ デバイス → サーバー: コマンド詳細取得
const getCommandDetails = async (req, res, next) => {
  try {
    const deviceUuid = req.device_uuid;
    const commandId = sanitize(req.params.id);

    const result = await deviceService.getCommandDetails(deviceUuid, commandId);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// ⑥ デバイス → サーバー: 自己ステータス送信
const updateDeviceStatus = async (req, res, next) => {
  try {
    const deviceUuid = req.device_uuid;
    const batteryLevel = req.body.battery_level;
    const isSitting = req.body.is_sitting === true || req.body.is_sitting === 'true';
    const otherStatus = req.body.other_status;

    const result = await deviceService.updateDeviceStatus(deviceUuid, batteryLevel, isSitting, otherStatus);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// ⑦ デバイス → サーバー: デバイス設定取得
const getDeviceSettings = async (req, res, next) => {
  try {
    const deviceUuid = req.device_uuid;
    const result = await deviceService.getDeviceSettings(deviceUuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// ⑧ デバイス → サーバー: 生存確認 (ping)
const ping = async (req, res, next) => {
  try {
    const deviceUuid = req.device_uuid;
    const result = await deviceService.ping(deviceUuid);
    res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

// ⑨ デバイス → サーバー: 実行確認 (ACK)
const ackCommand = async (req, res, next) => {
  try {
    const deviceUuid = req.device_uuid;
    const commandId = sanitize(req.params.id);

    const result = await deviceService.ackCommand(deviceUuid, commandId);
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
  polling,
  getCommandDetails,
  updateDeviceStatus,
  getDeviceSettings,
  ping,
  ackCommand,
};