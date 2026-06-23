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

    const decoded = await ownerTokenService.validateOwnerToken(token);
    if (!decoded) {
      return res.status(401).json({ status: 401, message: 'OwnerToken が無効または失効しています。' });
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
