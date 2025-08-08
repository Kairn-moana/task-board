// 参数验证工具
const { AppError } = require('./errorHandler');

// 验证必需字段
const validateRequired = (fields, data) => {
  const missing = [];
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new AppError(
      `缺少必需字段: ${missing.join(', ')}`,
      400,
      'MISSING_REQUIRED_FIELDS'
    );
  }
};

// 验证ID格式
const validateId = (id, fieldName = 'ID') => {
  const numId = parseInt(id);
  if (isNaN(numId) || numId <= 0) {
    throw new AppError(
      `${fieldName} 格式无效，必须是正整数`,
      400,
      'INVALID_ID_FORMAT'
    );
  }
  return numId;
};

// 验证字符串长度
const validateStringLength = (str, fieldName, min = 0, max = 255) => {
  if (typeof str !== 'string') {
    throw new AppError(
      `${fieldName} 必须是字符串`,
      400,
      'INVALID_STRING_TYPE'
    );
  }
  
  const trimmed = str.trim();
  
  if (trimmed.length < min) {
    throw new AppError(
      `${fieldName} 长度不能少于 ${min} 个字符`,
      400,
      'STRING_TOO_SHORT'
    );
  }
  
  if (trimmed.length > max) {
    throw new AppError(
      `${fieldName} 长度不能超过 ${max} 个字符`,
      400,
      'STRING_TOO_LONG'
    );
  }
  
  return trimmed;
};

// 验证用户名格式
const validateUsername = (username) => {
  const trimmed = validateStringLength(username, '用户名', 3, 20);
  
  // 用户名只能包含字母、数字和下划线
  const pattern = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
  if (!pattern.test(trimmed)) {
    throw new AppError(
      '用户名只能包含字母、数字、下划线和中文字符',
      400,
      'INVALID_USERNAME_FORMAT'
    );
  }
  
  return trimmed;
};

// 验证密码强度
const validatePassword = (password) => {
  if (typeof password !== 'string') {
    throw new AppError(
      '密码必须是字符串',
      400,
      'INVALID_PASSWORD_TYPE'
    );
  }
  
  if (password.length < 6) {
    throw new AppError(
      '密码长度不能少于6个字符',
      400,
      'PASSWORD_TOO_SHORT'
    );
  }
  
  if (password.length > 128) {
    throw new AppError(
      '密码长度不能超过128个字符',
      400,
      'PASSWORD_TOO_LONG'
    );
  }
  
  return password;
};

module.exports = {
  validateRequired,
  validateId,
  validateStringLength,
  validateUsername,
  validatePassword
};
