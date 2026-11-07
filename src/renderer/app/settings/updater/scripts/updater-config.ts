// Settings: updater config section - entry barrel [设置：更新配置区域 - 入口]
// State in updater-config-state.ts, status text in updater-config-status.ts,
// load/save/check/events/hint split into their own files.
// [状态在 updater-config-state.ts，状态文本在 updater-config-status.ts，
//  加载/保存/检查/事件/提示各自独立文件]

export { getIsDevEnvironment, getUpdaterConfig } from './updater-config-state.js';
export { updateStatusText } from './updater-config-status.js';
export { loadUpdaterConfig } from './updater-config-load.js';
export { saveUpdaterConfig } from './updater-config-save.js';
export { handleCheckNow } from './updater-config-check.js';
export { bindUpdaterEvents } from './updater-config-events.js';
export { loadUpdateHint } from './updater-config-hint.js';
