// Logger: path resolution - barrel [日志 - 路径解析 - 汇总出口]
// Layout under <userData>/logs/sparklet.main/:
//   kernel/kernel.log              <- core & main process (rotated)
//   modules/0a/0a.log              <- each registered module gets its own coded folder
//   modules/0a/0a.<timestamp>.log  <- its rotated backups
// [布局位于 <userData>/logs/sparklet.main/：
//  kernel/kernel.log 记录核心与主进程；每个已登记模块在 modules/<代号>/<代号>.log]
//
// Split out [已拆分]：state & dirs → logger-path-store.ts, scope resolve → logger-path-resolve.ts.

export {
  initLogPaths,
  getRawLogRoot,
  getCoreDir,
  getModulesDir,
  getModuleCodes,
  getLogRoot,
} from 'sparklet/main/services/logger/logger-path-store.js';
export { resolve } from 'sparklet/main/services/logger/logger-path-resolve.js';
