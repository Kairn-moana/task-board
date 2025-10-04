// 环境配置
export const ENV = {
  NODE_ENV: import.meta.env.MODE || "development",
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://karin-task-board-api.onrender.com/api",
  ENABLE_DEBUG:
    import.meta.env.VITE_ENABLE_DEBUG === "true" ||
    import.meta.env.MODE === "development",

  // 判断是否为开发环境
  isDevelopment: () => ENV.NODE_ENV === "development",

  // 判断是否为生产环境
  isProduction: () => ENV.NODE_ENV === "production",

  // 调试日志 - 只在开发环境或启用调试时输出
  debug: (...args) => {
    if (ENV.ENABLE_DEBUG) {
    }
  },

  // 错误日志 - 始终输出
  error: (...args) => {
    console.error("[ERROR]", ...args);
  },

  // 警告日志
  warn: (...args) => {
    console.warn("[WARN]", ...args);
  },
};
