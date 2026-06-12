import authService from '../service/authService.mjs';
import xss from 'xss';

const sanitize = (value) => (typeof value === 'string' ? xss(value) : value);

const login = async (req, res, next) => {
  try {
    const identifier = sanitize(req.body.identifier || req.body.email || req.body.username);
    const password = sanitize(req.body.password);

    if (!identifier || !password) {
      return res.status(400).json({ status: 400, message: 'identifier と password を入力してください。' });
    }

    const result = await authService.login(identifier, password);

    if (result.status === 200) {
      res.cookie('access_token', result.data.accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
      });
      res.cookie('refresh_token', result.data.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  return res.status(200).json({
    status: 200,
    message: '認証済みです。',
    data: { user_uuid: req.user_uuid || null },
  });
};

const logout = async (req, res, next) => {
  try {
    const userUuid = req.user_uuid || req.body.user_uuid;
    if (userUuid) {
      await authService.logout(userUuid);
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(200).json({ status: 200, message: 'ログアウトしました。' });
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  me,
  logout,
};
