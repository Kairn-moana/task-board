// API 工具类 - 统一的错误处理和响应格式
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class ApiResponse {
  constructor(success, data, error = null, message = '') {
    this.success = success;
    this.data = data;
    this.error = error;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = '') {
    return new ApiResponse(true, data, null, message);
  }

  static error(error, message = '') {
    return new ApiResponse(false, null, error, message);
  }
}

// 统一的请求处理器
export async function handleApiRequest(requestFn, errorMessage = '请求失败') {
  try {
    const response = await requestFn();
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.msg || errorData.message || errorMessage,
        response.status,
        errorData.code
      );
    }
    
    const data = await response.json();
    return ApiResponse.success(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return ApiResponse.error(error, error.message);
    }
    
    // 网络错误或其他错误
    const networkError = new ApiError(
      '网络连接错误，请检查网络连接',
      0,
      'NETWORK_ERROR'
    );
    return ApiResponse.error(networkError, networkError.message);
  }
}

// 请求拦截器
export function createApiRequest(baseURL = "http://localhost:3000/api") {
  return {
    async request(endpoint, options = {}) {
      const token = localStorage.getItem("token");
      const url = `${baseURL}${endpoint}`;
      
      const defaultOptions = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      
      if (token && token !== "dev-temp-token") {
        defaultOptions.headers["Authorization"] = `Bearer ${token}`;
      }
      
      const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      };
      
      return handleApiRequest(
        () => fetch(url, mergedOptions),
        `请求 ${endpoint} 失败`
      );
    },
    
    get(endpoint, options = {}) {
      return this.request(endpoint, { ...options, method: "GET" });
    },
    
    post(endpoint, data, options = {}) {
      return this.request(endpoint, {
        ...options,
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    
    put(endpoint, data, options = {}) {
      return this.request(endpoint, {
        ...options,
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    
    delete(endpoint, options = {}) {
      return this.request(endpoint, { ...options, method: "DELETE" });
    },
  };
}

export const api = createApiRequest();
