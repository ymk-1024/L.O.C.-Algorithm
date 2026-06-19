import jwt from 'jsonwebtoken';
import db from '../repository/db.mjs';

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'loc-dev-access-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'loc-dev-refresh-secret';

const query = async (sql, values) => {
  const connection = await db.getPool().getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
};

const generateAccessToken = (userUuid) => jwt.sign({ user_uuid: userUuid }, ACCESS_SECRET, { expiresIn: '30m' });
const generateRefreshToken = (userUuid) => jwt.sign({ user_uuid: userUuid }, REFRESH_SECRET, { expiresIn: '7d' });

const setTokenCookie = (res, token, name) => {
  res.cookie(name, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: name === 'access_token' ? 30 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  });
};

// Cookie または Authorization: Bearer ヘッダーからトークンを取得
const extractAccessToken = (req) => {
  if (req.cookies?.access_token) return req.cookies.access_token;
  const auth = req.headers?.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
};

const verifyCookie = async (req, res, next) => {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      return res.status(401).json({ status: 401, message: '認証情報が不足しています。' });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET);
    if (!decoded?.user_uuid) {
      return res.status(401).json({ status: 401, message: 'トークンが不正です。' });
    }

    req.user_uuid = decoded.user_uuid;
    req.token_data = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ status: 401, message: '認証に失敗しました。' });
  }
};

const verifyRefreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ status: 401, message: '認証情報が不足しています。' });
    }

    const stored = await query('SELECT * FROM refresh_tokens WHERE token = ? LIMIT 1', [token]);
    if (!stored || stored.length === 0) {
      return res.status(401).json({ status: 401, message: '認証されていません。' });
    }

    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (!decoded?.user_uuid) {
      return res.status(401).json({ status: 401, message: 'トークンが不正です。' });
    }

    req.user_uuid = decoded.user_uuid;
    req.token_data = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ status: 401, message: '認証に失敗しました。' });
  }
};

const autoRefreshAuth = async (req, res, next) => {
  try {
    // Cookie 優先、なければ Authorization ヘッダーから取得
    const accessToken = req.cookies?.access_token
      || (() => { const a = req.headers?.authorization; return a?.startsWith('Bearer ') ? a.slice(7) : null; })();
    const refreshToken = req.cookies?.refresh_token;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, ACCESS_SECRET);
        req.user_uuid = decoded.user_uuid;
        return next();
      } catch (error) {
        if (error.name !== 'TokenExpiredError') {
          return res.status(401).json({ status: 401, message: '認証トークンが不正です。' });
        }
      }
    }

    if (!refreshToken) {
      return res.status(401).json({ status: 401, message: '再認証が必要です。' });
    }

    const rows = await query('SELECT * FROM refresh_tokens WHERE token = ? LIMIT 1', [refreshToken]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ status: 401, message: '認証されていません。' });
    }

    const decodedRefresh = jwt.verify(refreshToken, REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decodedRefresh.user_uuid);
    setTokenCookie(res, newAccessToken, 'access_token');

    req.user_uuid = decodedRefresh.user_uuid;
    req.token_data = { access_token: newAccessToken, refresh_token: refreshToken };
    return next();
  } catch (error) {
    return res.status(401).json({ status: 401, message: '再認証に失敗しました。' });
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookie,
  verifyCookie,
  verifyRefreshToken,
  autoRefreshAuth,
};
