// Core window-control API (renderer side) [核心窗口控制 API (渲染侧)]
// Wraps window control, secondary-window management and their push events [封装窗口控制、副窗口管理及其推送事件]
//
// Split out [已拆分]：current window controls → window-api-control.ts,
// secondary windows → window-api-secondary.ts, push events → window-api-events.ts.

import { windowApiControl } from 'sparklet/renderer/shared/api/window/window-api-control.js';
import { windowApiSecondary } from 'sparklet/renderer/shared/api/window/window-api-secondary.js';
import { windowApiEvents } from 'sparklet/renderer/shared/api/window/window-api-events.js';

export const windowApi = {
  ...windowApiControl,
  ...windowApiSecondary,
  ...windowApiEvents,
};
