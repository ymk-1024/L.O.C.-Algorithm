import { Router } from 'express';
import deviceHandler from '../handler/deviceHandler.mjs';
import { validateDeviceCreation } from '../middleware/validationMiddleware.mjs';
import authMiddleware from '../middleware/authMiddleware.mjs';
import ownerTokenMiddleware from '../middleware/ownerTokenMiddleware.mjs';

const device = Router();

// ─── 読み取り系：認証不要 ────────────────────────────
device.get('/',        deviceHandler.getAllDevices);
device.get('/:uuid',  deviceHandler.getDeviceById);

// ─── App 向け（ユーザーJWT認証必要） ────────────────────
// App がデバイスの OwnerToken を申請する
device.post('/issue-token',
  authMiddleware.autoRefreshAuth,
  deviceHandler.issueOwnerToken
);

// 通常のデバイス登録（App 経由）
device.post('/',
  authMiddleware.autoRefreshAuth,
  validateDeviceCreation,
  deviceHandler.createDevice
);

device.put('/:uuid',
  authMiddleware.autoRefreshAuth,
  deviceHandler.updateDevice
);

device.delete('/:uuid',
  authMiddleware.autoRefreshAuth,
  deviceHandler.deleteDevice
);

// ─── デバイス向け（OwnerToken 認証必要） ──────────────
// デバイスが自己登録する（ハードウェアが叩く）
device.post('/self-register',
  ownerTokenMiddleware.verifyOwnerToken,
  deviceHandler.selfRegister
);

// デバイスが OwnerToken を更新する
device.post('/token/refresh',
  ownerTokenMiddleware.verifyOwnerToken,
  deviceHandler.refreshOwnerToken
);

export default device;
