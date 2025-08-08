// 统一的错误处理中间件
const ResponseHandler = require('./responseHandler');

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 异步错误捕获包装器
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 全局错误处理中间件
const globalErrorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, code } = err;

  // 开发环境下打印详细错误
  if (process.env.NODE_ENV === 'development') {
    console.error('错误详情:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // 数据库约束错误处理
  if (err.code === '23505') { // PostgreSQL unique constraint
    message = '数据已存在，请检查唯一性约束';
    statusCode = 400;
    code = 'DUPLICATE_ERROR';
  }

  if (err.code === '23503') { // PostgreSQL foreign key constraint
    message = '关联数据不存在，请检查外键约束';
    statusCode = 400;
    code = 'FOREIGN_KEY_ERROR';
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    message = 'Token无效';
    statusCode = 401;
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token已过期';
    statusCode = 401;
    code = 'EXPIRED_TOKEN';
  }

  // 返回错误响应
  return ResponseHandler.error(res, message, statusCode, code);
};

// 404错误处理
const notFoundHandler = (req, res) => {
  return ResponseHandler.notFoundError(res, `路由 ${req.originalUrl} 未找到`);
};

module.exports = {
  AppError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler
};
