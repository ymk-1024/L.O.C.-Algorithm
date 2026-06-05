import { Router } from 'express';
import deviceHandler from '../handler/deviceHandler.mjs';
import { validateDeviceCreation } from '../middleware/validationMiddleware.mjs';

const device = Router();

device.get('/', deviceHandler.getAllDevices);
device.get('/:uuid', deviceHandler.getDeviceById);
device.post('/', validateDeviceCreation, deviceHandler.createDevice);

export default device;
