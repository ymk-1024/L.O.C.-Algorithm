import jwt from 'jsonwebtoken';
import db from '../repository/db.mjs';
import usersService from './usersService.mjs';

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'loc-dev-access-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'loc-dev-refresh-secret';

const generateAccessToken = (userUuid) => {
  return jwt.sign({ user_uuid: userUuid }, ACCESS_SECRET, { expiresIn: '30m' });
};

const generateRefreshToken = (userUuid) => {
  return jwt.sign({ user_uuid: userUuid }, REFRESH_SECRET, { expiresIn: '7d' });
};

const query = async (sql, values) => {
  const connection = await db.getPool().getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
};

const storeRefreshToken = async (userUuid, refreshToken) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (user_uuid, token, expires_at) VALUES (?, ?, ?) ' +
    'ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = CURRENT_TIMESTAMP, expires_at = VALUES(expires_at)',
    [userUuid, refreshToken, expiresAt]
  );
};

const login = async (identifier, password) => {
  try {
    const user = await usersService.findUserForLogin(identifier);

    if (!user || !usersService.verifyPassword(password, user.password)) {
      return { status: 401, message: 'メールアドレスまたはパスワードが正しくありません。' };
    }

    const accessToken = generateAccessToken(user.uuid);
    const refreshToken = generateRefreshToken(user.uuid);

    await storeRefreshToken(user.uuid, refreshToken);

    return {
      status: 200,
      message: 'ログインしました。',
      data: {
        user: {
          uuid: user.uuid,
          username: user.username,
          email: user.email,
        },
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    throw new Error(`Auth Error: ${error.message}`);
  }
};

const logout = async (userUuid) => {
  try {
    await query('DELETE FROM refresh_tokens WHERE user_uuid = ?', [userUuid]);
    return { status: 200, message: 'ログアウトしました。' };
  } catch (error) {
    throw new Error(`Auth Error: ${error.message}`);
  }
};

export default {
  login,
  logout,
  generateAccessToken,
  generateRefreshToken,
};
