// Logger: path state + directory init [日志 - 路径状态与目录初始化]
// Layout under <userData>/logs/sparklet.main/:
//   kernel/kernel.log              <- core & main process (rotated)
//   modules/0a/0a.log              <- each registered module gets its own coded folder
//   modules/0a/0a.<timestamp>.log  <- its rotated backups
// [布局位于 <userData>/logs/sparklet.main/：
//  kernel/kernel.log 记录核心与主进程；每个已登记模块在 modules/<代号>/<代号>.log]

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import manifest from 'sparklet/main/services/logger/logger-manifest.json';

let logRoot = '';
let modulesDir = '';

export const moduleMap: Record<string, string> = (manifest && manifest.map) || {};
export const warnedUnknown = new Set<string>();

/** Create the log directories and remember roots [创建日志目录并记住根路径] */
export function initLogPaths(): void {
  logRoot = path.join(app.getPath('userData'), 'logs');
  modulesDir = path.join(logRoot, 'sparklet.main', 'modules');
  fs.mkdirSync(getCoreDir(), { recursive: true });
  fs.mkdirSync(modulesDir, { recursive: true });
}

/** Raw logs root on disk [磁盘上的日志总根] */
export function getRawLogRoot(): string { return logRoot; }

/** Core log directory (kernel) [核心日志目录] */
export function getCoreDir(): string {
  return path.join(logRoot, 'sparklet.main', 'kernel');
}

/** Modules log directory [模块日志目录] */
export function getModulesDir(): string { return modulesDir; }

/** Registered module codes [已登记模块代号] */
export function getModuleCodes(): string[] {
  return Array.from(new Set(Object.values(moduleMap)));
}

/** Absolute path of the logs root (<userData>/logs/sparklet.main/) [日志根目录绝对路径 (<userData>/logs/sparklet.main/)] */
export function getLogRoot(): string {
  return path.join(logRoot, 'sparklet.main');
}
