// Download management entry [下载管理入口]
// Single download in download-file.ts, retry in download-retry.ts [单次下载在 download-file.ts，重试在 download-retry.ts]

export { downloadFile } from 'sparklet/main/updater/download/download-file.js';
export type { ProgressCallback } from 'sparklet/main/updater/download/download-file.js';
export { downloadWithRetry } from 'sparklet/main/updater/download/download-retry.js';
