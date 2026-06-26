import { Router } from 'express';
import deviceHandler from '../handler/deviceHandler.mjs';
import { validateDeviceCreation } from '../middleware/validationMiddleware.mjs';
import authMiddleware from '../middleware/authMiddleware.mjs';
import ownerTokenMiddleware from '../middleware/ownerTokenMiddleware.mjs';

const device = Router();

// ─── 読み取り系：認証不要 ────────────────────────────
device.get('/',        deviceHandler.getAllDevices);

// 注意: /:uuid のようなワイルドカードルートは、他の固定ルート（/pingなど）より後に定義する必要があります。
// ファイル末尾に移動しました。

// ─── App 向け（ユーザーJWT認証必要） ────────────────────
// App がデバイスの OwnerToken を申請する
device.post('/issue-token',
  authMiddleware.autoRefreshAuth,
  deviceHandler.issueOwnerToken
);



// 注意: PUT /:uuid や DELETE /:uuid についても、念のためファイル末尾に移動しました。

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

// ポーリング用
device.get('/polling',
  ownerTokenMiddleware.verifyOwnerToken,
  deviceHandler.polling
);

// 自己ステータス送信
device.post('/status',
  ownerTokenMiddleware.verifyOwnerToken,
  deviceHandler.updateDeviceStatus
);

// デバイス設定取得
device.get('/settings',
  ownerTokenMiddleware.verifyOwnerToken,
  deviceHandler.getDeviceSettings
);

// 生存確認 (ping)
device.get('/ping',
  ownerTokenMiddleware.verifyOwnerToken,
  deviceHandler.ping
);

// コマンド詳細取得
device.get('/command/:id',
  ownerTokenMiddleware.verifyOwnerToken,
  deviceHandler.getCommandDetails
);

// 実行確認 (ACK)
device.get('/command/:id/ack',
  ownerTokenMiddleware.verifyOwnerToken,
  deviceHandler.ackCommand
);

// ─── ワイルドカードルート (/:uuid) は最後に定義 ─────────
device.get('/:uuid',  deviceHandler.getDeviceById);

device.put('/:uuid',
  authMiddleware.autoRefreshAuth,
  deviceHandler.updateDevice
);

device.delete('/:uuid',
  authMiddleware.autoRefreshAuth,
  deviceHandler.deleteDevice
);

export default device;
