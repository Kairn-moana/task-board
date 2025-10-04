// 统一导出所有API服务
export * as boardService from "./boardService.js";
export * as cardService from "./cardService.js";
export * as attachmentService from "./attachmentService.js";
export * as tagService from "./tagService.js";
export * as authService from "./authService.js";
export * as timeService from "./timeService.js";
export * from "./subtaskService.js";

// 特殊处理 analyticsService - 直接导出对象本身
export { analyticsService } from "./analyticsService.js";

// 添加 emotionService 导出
export * as emotionService from "./emotionService.js";

export * as emergencyKitService from "./emergencyKitService.js";
export * as rewardService from "./rewardService.js";

// 为了向后兼容，也导出别名
export * as BoardAPI from "./boardService.js";
export * as CardAPI from "./cardService.js";
export * as AttachmentAPI from "./attachmentService.js";
export * as TagAPI from "./tagService.js";
export * as AuthAPI from "./authService.js";
export * as TimeAPI from "./timeService.js";
export { analyticsService as AnalyticsAPI } from "./analyticsService.js";
export * as EmotionAPI from "./emotionService.js";
export * as EmergencyKitAPI from "./emergencyKitService.js";
export * as RewardAPI from "./rewardService.js";
