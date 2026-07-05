import jwt from 'jsonwebtoken';
import ownerTokenRepository from '../repository/ownerTokenRepository.mjs';

const OWNER_SECRET = process.env.OWNER_SECRET || 'loc-dev-owner-secret-change-in-production';
const EXPIRES_IN   = '30d';
const EXPIRES_MS   = 30 * 24 * 60 * 60 * 1000;

// JWT 生成（device_uuid はここには含めない）
const generateOwnerToken = (userUuid, name) =>
  jwt.sign(
    { user_uuid: userUuid, name, type: 'owner' },
    OWNER_SECRET,
    { expiresIn: EXPIRES_IN }
  );

// 有効期限を MySQL 形式に変換
const expiresAtStr = () =>
  new Date(Date.now() + EXPIRES_MS).toISOString().slice(0, 19).replace('T', ' ');

const ownerTokenService = {

  // ① App → サーバー: OwnerToken 発行申請（deviceUuid は不要）
  issueOwnerToken: async (userUuid, name) => {
    try {
      const token     = generateOwnerToken(userUuid, name);
      const expiresAt = expiresAtStr();

      // DB に保存（device_uuid は NULL のまま ─ デバイス登録時に埋まる）
      await ownerTokenRepository.createOwnerToken(userUuid, name, token, expiresAt);

      return {
        status: 201,
        message: 'OwnerToken を発行しました。BLE経由でデバイスに送信してください。',
        data: { ownerToken: token, name, expiresAt },
      };
    } catch (error) {
      throw new Error(`Token Error: ${error.message}`);
    }
  },

  // ② トークン検証 → デコード結果を返す（ミドルウェア用）
  validateOwnerToken: async (token) => {
    try {
      const decoded = jwt.verify(token, OWNER_SECRET);
      if (!decoded?.user_uuid || decoded?.type !== 'owner') return null;

      // DB に存在するか（失効・無効化チェック）
      const stored = await ownerTokenRepository.getOwnerTokenByToken(token);
      if (!stored) return null;

      return { ...decoded, device_uuid: stored.device_uuid };
    } catch {
      return null;
    }
  },

  // ③ デバイス自己登録: token からユーザー情報を取得し、デバイスUUIDを紐づける
  bindDeviceToToken: async (token, deviceUuid) => {
    try {
      const decoded = jwt.verify(token, OWNER_SECRET);
      if (!decoded?.user_uuid || decoded?.type !== 'owner') {
        return { status: 401, message: 'OwnerToken が不正です。' };
      }

      // DB に存在するか確認
      const stored = await ownerTokenRepository.getOwnerTokenByToken(token);
      if (!stored) {
        return { status: 401, message: 'OwnerToken が無効または失効しています。' };
      }

      // すでに別のデバイスに紐づいているか確認
      if (stored.device_uuid && stored.device_uuid !== deviceUuid) {
        return { status: 409, message: 'このOwnerTokenはすでに別のデバイスに使用されています。' };
      }

      // device_uuid を紐づける
      await ownerTokenRepository.assignDeviceToToken(token, deviceUuid);

      return {
        status: 200,
        userUuid: stored.user_uuid,
        name:     stored.name,
      };
    } catch {
      return { status: 401, message: 'OwnerToken の検証に失敗しました。' };
    }
  },

  // ④ OwnerToken 更新（デバイスからの更新要求）
  refreshOwnerToken: async (currentToken) => {
    try {
      let decoded;
      try {
        decoded = jwt.verify(currentToken, OWNER_SECRET);
      } catch {
        return { status: 401, message: 'OwnerToken が無効または期限切れです。' };
      }

      if (!decoded?.user_uuid || decoded?.type !== 'owner') {
        return { status: 401, message: 'OwnerToken の形式が不正です。' };
      }

      const stored = await ownerTokenRepository.getOwnerTokenByToken(currentToken);
      if (!stored) {
        return { status: 401, message: 'OwnerToken が無効化されています。' };
      }

      if (!stored.device_uuid) {
        return { status: 400, message: 'このOwnerTokenはまだデバイスに紐づいていません。' };
      }

      const newToken  = generateOwnerToken(stored.user_uuid, stored.name);
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
