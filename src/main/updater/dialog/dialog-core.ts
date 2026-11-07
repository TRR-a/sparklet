// Renderer custom dialog core - replaces native system dialog [渲染层自定义弹窗核心 - 替换系统原生 dialog]
// Entry point, re-exports dialog API [入口文件，re-export 弹窗 API]
// Types in dialog-types.ts, prompting in dialog-prompt.ts, response handling in dialog-response.ts [类型在 dialog-types.ts，弹窗调用在 dialog-prompt.ts，响应处理在 dialog-response.ts]

export type {
  ProgressCallback,
  CompleteCallback,
  DialogParams,
  DialogOptions
} from './dialog-types.js';

export { findAvailableWindow, promptRendererDialog } from './dialog-prompt.js';

export { ensureDialogResponseHandler } from './dialog-response.js';
