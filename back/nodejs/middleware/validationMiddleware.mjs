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

export const validateDeviceCreation = (req, res, next) => {
  const { userUuid, name, type, status } = req.body;
  const errors = [];

  if (!userUuid || typeof userUuid !== 'string' || userUuid.trim() === '') {
    errors.push('userUuid is required');
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required');
  }
  if (!type || typeof type !== 'string' || type.trim() === '') {
    errors.push('type is required');
  }
  if (!status || typeof status !== 'string' || status.trim() === '') {
    errors.push('status is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ status: 400, error: 'Validation failed', details: errors });
  }
  next();
};

export const validateSitDataCreation = (req, res, next) => {
  const { deviceUuid } = req.body;
  const errors = [];

  if (!deviceUuid || typeof deviceUuid !== 'string' || deviceUuid.trim() === '') {
    errors.push('deviceUuid is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ status: 400, error: 'Validation failed', details: errors });
  }
  next();
};

export const validateActivityDataCreation = (req, res, next) => {
  const { deviceUuid, type } = req.body;
  const errors = [];

  if (!deviceUuid || typeof deviceUuid !== 'string' || deviceUuid.trim() === '') {
    errors.push('deviceUuid is required');
  }
  if (!type || typeof type !== 'string' || type.trim() === '') {
    errors.push('type is required');
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
