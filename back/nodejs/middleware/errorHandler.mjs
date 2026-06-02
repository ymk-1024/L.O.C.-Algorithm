// [NEW] エラーハンドリング ミドルウェア

// グローバルエラーハンドラー
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    status,
    error: message,
    timestamp: new Date().toISOString(),
  });
};

// 404 ハンドラー
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Route not found',
    path: req.path,
  });
};
