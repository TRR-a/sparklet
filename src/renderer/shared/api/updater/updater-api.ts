// Core self-updater API (renderer side) [核心自更新 API (渲染侧)]
// Wraps updater flow, updater config, update-cache and updater dialog/toast channels [封装更新流程、更新配置、更新缓存及更新弹窗/Toast 通道]
//
// Split out [已拆分]：flow → updater-api-flow.ts, config → updater-api-config.ts,
// cache → updater-api-cache.ts, events/dialog/toast → updater-api-events.ts.

import { updaterApiFlow } from 'sparklet/renderer/shared/api/updater/updater-api-flow.js';
import { updaterApiConfig } from 'sparklet/renderer/shared/api/updater/updater-api-config.js';
import { updaterApiCache } from 'sparklet/renderer/shared/api/updater/updater-api-cache.js';
import { updaterApiEvents } from 'sparklet/renderer/shared/api/updater/updater-api-events.js';

export const updaterApi = {
  ...updaterApiFlow,
  ...updaterApiConfig,
  ...updaterApiCache,
  ...updaterApiEvents,
};
