// Updater dialog - entry point, re-exports dialog API [更新器弹窗 - 入口文件，re-export 弹窗 API]
// Renderer dialog core in dialog-core.ts [渲染层弹窗核心在 dialog-core.ts]
// Update-specific prompts in dialog-prompts.ts [更新专用弹窗在 dialog-prompts.ts]
// Toast & error formatting in dialog-toast.ts [Toast 与错误格式化在 dialog-toast.ts]

export { findAvailableWindow, promptRendererDialog, ensureDialogResponseHandler } from './dialog-core.js';
export type { ProgressCallback, CompleteCallback, DialogParams, DialogOptions } from './dialog-core.js';

export { formatDate, showUpdateDialog, showNotifyOnlyDialog, showRestartDialog } from './dialog-prompts.js';

export { broadcastToast, formatFriendlyUpdateError } from './dialog-toast.js';
