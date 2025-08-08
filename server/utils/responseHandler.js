// 统一的响应处理器
class ResponseHandler {
  static success(res, data, message = '成功', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message = '服务器错误', statusCode = 500, code = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: {
        code,
        statusCode
      },
      timestamp: new Date().toISOString()
    });
  }

  static validationError(res, message = '参数验证失败', details = []) {
    return res.status(400).json({
      success: false,
      message,
      error: {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details
      },
      timestamp: new Date().toISOString()
    });
  }

  static unauthorizedError(res, message = '未授权访问') {
    return this.error(res, message, 401, 'UNAUTHORIZED');
  }

  static forbiddenError(res, message = '权限不足') {
    return this.error(res, message, 403, 'FORBIDDEN');
  }

  static notFoundError(res, message = '资源未找到') {
    return this.error(res, message, 404, 'NOT_FOUND');
  }
}

module.exports = ResponseHandler;
