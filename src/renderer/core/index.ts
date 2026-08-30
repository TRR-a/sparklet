// Core renderer-side API barrel [核心渲染侧 API 统一导出]
// Modules import core capabilities from here instead of touching window.* directly [模块从此处引入核心能力，而非直接访问 window.*]

export { bus } from './ipc-bus.js';
export { storeApi } from './store-api.js';
export { windowApi } from './window-api.js';
export { appApi } from './app-api.js';
export { broadcastApi } from './broadcast-api.js';
export { updaterApi } from './updater-api.js';
export { APP_VERSION, APP_CODENAME } from './app-info.js';
