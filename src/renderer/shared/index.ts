// Core renderer-side API barrel [核心渲染侧 API 统一导出]
// Modules import core capabilities from here instead of touching window.* directly [模块从此处引入核心能力，而非直接访问 window.*]

export { bus } from 'sparklet/renderer/shared/ipc/ipc-bus.js';
export { storeApi } from 'sparklet/renderer/shared/api/store-api.js';
export { windowApi } from 'sparklet/renderer/shared/api/window/window-api.js';
export { appApi } from 'sparklet/renderer/shared/api/app-api.js';
export { broadcastApi } from 'sparklet/renderer/shared/api/broadcast-api.js';
export { updaterApi } from 'sparklet/renderer/shared/api/updater/updater-api.js';
export { systemApi } from 'sparklet/renderer/shared/api/system-api.js';
export { logApi, errText } from 'sparklet/renderer/shared/api/log-api.js';
export { installGlobalErrorHooks } from 'sparklet/renderer/shared/api/global-error-hooks.js';
export { APP_VERSION, APP_CODENAME } from 'sparklet/renderer/shared/app-info.js';
export { highlightCode, getLanguageForFile } from 'sparklet/renderer/shared/highlight/highlight.js';
export { initCustomTooltip } from 'sparklet/renderer/shared/ui/tooltip/custom-tooltip.js';
