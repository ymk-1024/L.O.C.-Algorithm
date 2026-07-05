import ownerTokenService from '../service/ownerTokenService.mjs';

// Authorization: OwnerToken <token> からトークンを取り出す
export const extractOwnerToken = (req) => {
  const auth = req.headers?.authorization;
  if (auth && auth.startsWith('OwnerToken ')) return auth.slice(11);
  return null;
};

// OwnerToken を検証し、デコード結果を req に付与する
export const verifyOwnerToken = async (req, res, next) => {
  try {
    const token = extractOwnerToken(req);
    if (!token) {
      return res.status(401).json({ status: 401, message: 'OwnerToken が不足しています。Authorization: OwnerToken <token> 形式で送信してください。' });
    }

    // X-Nonce & X-Timestamp check
    const timestampHeader = req.headers['x-timestamp'];
    const nonceHeader = req.headers['x-nonce'];
    const deviceUuidHeader = req.headers['x-device-uuid'];

    if (!timestampHeader || !nonceHeader) {
      return res.status(400).json({ status: 400, message: '共通ヘッダ (X-Timestamp, X-Nonce) が不足しています。' });
    }

    // タイムスタンプ妥当性確認 (前後5分 JST 300秒以内)
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestampHeader, 10);
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 300) {
      return res.status(400).json({ status: 400, message: 'X-Timestamp が無効または許容範囲外です。' });
    }

    const decoded = await ownerTokenService.validateOwnerToken(token);
    if (!decoded) {
      return res.status(401).json({ status: 401, message: 'OwnerToken が無効または失効しています。' });
    }

    // デバイス個体識別チェック（自己登録後は一致確認）
    if (decoded.device_uuid && deviceUuidHeader && decoded.device_uuid !== deviceUuidHeader) {
      return res.status(400).json({ status: 400, message: 'リクエストのデバイスUUIDが登録されているデバイスUUIDと一致しません。' });
    }

    req.device_uuid  = decoded.device_uuid;
    req.user_uuid    = decoded.user_uuid;
    req.owner_token  = token;
    return next();
  } catch (error) {
    return res.status(401).json({ status: 401, message: 'OwnerToken の検証に失敗しました。' });
  }
};

export default { verifyOwnerToken, extractOwnerToken };
