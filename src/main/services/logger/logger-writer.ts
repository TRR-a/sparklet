// File logger writer - barrel [文件日志写入器 - 汇总出口]
// Zero-dependency. Layout under <userData>/logs/sparklet.main/:
//   kernel/kernel.log              <- core & main process (rotated)
//   modules/0a/0a.log              <- each registered module gets its own coded folder
//   modules/0a/0a.<timestamp>.log  <- its rotated backups
//
// Module codes are NOT generated at runtime: the module->code map lives in source
// (logger-manifest.json) and is versioned with the code. A new module gets a line
// added there manually. Codes look like 0a,0b..0z, 1a..1z .. 9a..9z, 0aa..0zz.
// Renderer logs arrive over IPC (logger-ipc.ts) with a module scope.
// [零依赖。布局位于 <userData>/logs/sparklet.main/：
//  kernel/kernel.log 记录核心与主进程；每个已登记模块在 modules/<代号>/<代号>.log。
//  模块代号不在运行时生成：模块名->代号映射放在源码 logger-manifest.json，随代码版本管理；
//  新模块手动加一行。代号形如 0a,0b..0z, 1a..1z..9a..9z, 0aa..0zz。
//  渲染进程日志经 IPC (logger-ipc.ts) 携带模块 scope 写入]
//
// Split out [已拆分]：level/format → logger-format.ts, paths → logger-paths.ts,
// rotation → logger-rotate.ts, init+write → logger-write.ts.

export type { LogLevel } from './logger-format.js';
export { errText } from './logger-format.js';
export { getLogRoot } from './logger-paths.js';
export { markConsoleBroken, initLogger, write, logger, writeScoped } from './logger-write.js';
