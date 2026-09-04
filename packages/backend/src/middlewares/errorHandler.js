class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  const code = error.code || (error.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');
  const details = error.name === 'ValidationError'
    ? Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }))
    : undefined;

  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ success: false, error: { code, message: statusCode >= 500 ? 'Internal server error' : error.message, details } });
};

module.exports = { AppError, notFoundHandler, errorHandler };
