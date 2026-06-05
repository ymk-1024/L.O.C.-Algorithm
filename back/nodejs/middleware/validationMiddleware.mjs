// [NEW] 検証・サニタイズ ミドルウェア
import xss from 'xss';

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key]);
    }
  });
};

// XSSサニタイズ（リクエストの body / params / query に適用）
export const sanitizeBody = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);
  next();
};

// ユーザー作成の入力検証（POST /users のみ）
// [UPDATE] UUID はサーバー側で自動生成されるため、チェックを削除
export const validateUserCreation = (req, res, next) => {
  const { username, password, email } = req.body;
  const errors = [];

  if (!username || typeof username !== 'string' || username.trim() === '') {
    errors.push('username is required');
  }
  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('password is required');
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('valid email is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ status: 400, error: 'Validation failed', details: errors });
  }
  next();
};

// リクエストロギング
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
};
