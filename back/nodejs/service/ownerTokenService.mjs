import jwt from 'jsonwebtoken';
import ownerTokenRepository from '../repository/ownerTokenRepository.mjs';

const OWNER_SECRET = process.env.OWNER_SECRET || 'loc-dev-owner-secret-change-in-production';
const EXPIRES_IN    = '30d';
const EXPIRES_MS    = 30 * 24 * 60 * 60 * 1000;

// JWT 生成
const generateOwnerToken = (userUuid, deviceUuid) =>
  jwt.sign(
    { user_uuid: userUuid, device_uuid: deviceUuid, type: 'owner' },
    OWNER_SECRET,
    { expiresIn: EXPIRES_IN }
  );

// 有効期限を MySQL 形式に変換
const expiresAtStr = () =>
  new Date(Date.now() + EXPIRES_MS).toISOString().slice(0, 19).replace('T', ' ');

const ownerTokenService = {

  // ① App → サーバー: OwnerToken 発行申請
  issueOwnerToken: async (userUuid, deviceUuid, name) => {
    try {
      const existing = await ownerTokenRepository.getOwnerTokenByDeviceUuid(deviceUuid);
      if (existing) {
        return {
          status: 409,
          message: 'このデバイスUUIDにはすでにOwnerTokenが発行されています。更新は /device/token/refresh を使ってください。',
        };
      }

      const token     = generateOwnerToken(userUuid, deviceUuid);
      const expiresAt = expiresAtStr();

      await ownerTokenRepository.createOwnerToken(userUuid, deviceUuid, name, token, expiresAt);

      return {
        status: 201,
        message: 'OwnerToken を発行しました。',
        data: { ownerToken: token, deviceUuid, name, expiresAt },
      };
    } catch (error) {
      throw new Error(`Token Error: ${error.message}`);
    }
  },

  // ② トークン検証 → デコード結果を返す（ミドルウェア用）
  validateOwnerToken: async (token) => {
    try {
      const decoded = jwt.verify(token, OWNER_SECRET);
      if (!decoded?.device_uuid || decoded?.type !== 'owner') return null;

      // DB に存在するか（失効・無効化チェック）
      const stored = await ownerTokenRepository.getOwnerTokenByToken(token);
      if (!stored) return null;

      return decoded;
    } catch {
      return null;
    }
  },

  // ③ デバイス自己登録用: token から user_uuid / device_uuid / name を取得
  getSelfRegisterInfo: async (token) => {
    try {
      const decoded = jwt.verify(token, OWNER_SECRET);
      if (!decoded?.device_uuid || decoded?.type !== 'owner') return null;

      const stored = await ownerTokenRepository.getOwnerTokenByToken(token);
      if (!stored) return null;

      return {
        userUuid:   stored.user_uuid,
        deviceUuid: stored.device_uuid,
        name:       stored.name,
      };
    } catch {
      return null;
    }
  },

  // ④ OwnerToken 更新（デバイスからの更新要求）
  refreshOwnerToken: async (currentToken) => {
    try {
      // 現行トークンを検証
      let decoded;
      try {
        decoded = jwt.verify(currentToken, OWNER_SECRET);
      } catch {
        return { status: 401, message: 'OwnerToken が無効または期限切れです。' };
      }

      if (!decoded?.device_uuid || decoded?.type !== 'owner') {
        return { status: 401, message: 'OwnerToken の形式が不正です。' };
      }

      // DB に存在するか確認
      const stored = await ownerTokenRepository.getOwnerTokenByToken(currentToken);
      if (!stored) {
        return { status: 401, message: 'OwnerToken が無効化されています。' };
      }

      const newToken  = generateOwnerToken(stored.user_uuid, stored.device_uuid);
      const expiresAt = expiresAtStr();

      await ownerTokenRepository.updateOwnerToken(stored.device_uuid, newToken, expiresAt);

      return {
        status: 200,
        message: 'OwnerToken を更新しました。',
        data: { newOwnerToken: newToken, expiresAt },
      };
    } catch (error) {
      throw new Error(`Token Error: ${error.message}`);
    }
  },
};

export default ownerTokenService;
