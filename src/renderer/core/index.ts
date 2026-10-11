// Core renderer-side API barrel [核心渲染侧 API 统一导出]
// Modules import core capabilities from here instead of touching window.* directly [模块从此处引入核心能力，而非直接访问 window.*]

export { bus } from './ipc-bus.js';
export { storeApi } from './api/store-api.js';
export { windowApi } from './api/window-api.js';
export { appApi } from './api/app-api.js';
export { broadcastApi } from './api/broadcast-api.js';
export { updaterApi } from './api/updater-api.js';
export { pluginsApi } from './api/plugin-api.js';
export { systemApi } from './api/system-api.js';
export { logApi, errText, installGlobalErrorHooks } from './api/log-api.js';
export { APP_VERSION, APP_CODENAME } from './app-info.js';
export { highlightCode, getLanguageForFile } from './highlight/highlight.js';
export { initCustomTooltip } from './ui/custom-tooltip.js';
