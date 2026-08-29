// Core renderer-side API barrel [核心渲染侧 API 统一导出]
// Modules import core capabilities from here instead of touching window.* directly [模块从此处引入核心能力，而非直接访问 window.*]

export { bus } from './ipc-bus';
export { storeApi } from './store-api';
export { windowApi } from './window-api';
export { appApi } from './app-api';
export { broadcastApi } from './broadcast-api';
export { updaterApi } from './updater-api';
