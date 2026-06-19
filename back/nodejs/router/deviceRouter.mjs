import { Router } from 'express';
import deviceHandler from '../handler/deviceHandler.mjs';
import { validateDeviceCreation } from '../middleware/validationMiddleware.mjs';
import authMiddleware from '../middleware/authMiddleware.mjs';

const device = Router();

// 読み取り系：認証不要
device.get('/', deviceHandler.getAllDevices);
device.get('/:uuid', deviceHandler.getDeviceById);

// 書き込み系：JWT 認証必須
device.post('/',        authMiddleware.autoRefreshAuth, validateDeviceCreation, deviceHandler.createDevice);
device.put('/:uuid',   authMiddleware.autoRefreshAuth, deviceHandler.updateDevice);
device.delete('/:uuid', authMiddleware.autoRefreshAuth, deviceHandler.deleteDevice);

export default device;
