// Settings: config import/export section - handles config file backup and restore [设置：配置导入导出区域 - 处理配置文件备份和还原]
// Dev environment locks import/export buttons (only writes user config in production) [开发环境下锁定导入/导出按钮 (真实环境才写入用户实际配置)]
//
// Split out [已拆分]：dev lock → config-io-devlock.ts, export → config-io-export.ts,
// import → config-io-import.ts, events → config-io-events.ts.

export { applyImportExportDevLock } from 'sparklet/renderer/app/settings/cache/config-io/scripts/config-io-devlock.js';
export { handleExportUpdaterConfig } from 'sparklet/renderer/app/settings/cache/config-io/scripts/config-io-export.js';
export { handleImportUpdaterConfig } from 'sparklet/renderer/app/settings/cache/config-io/scripts/config-io-import.js';
export { bindImportExportEvents } from 'sparklet/renderer/app/settings/cache/config-io/scripts/config-io-events.js';
