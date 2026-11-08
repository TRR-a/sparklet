// Logger: scope -> log file resolution [日志 - 按 scope 解析日志文件]

import * as fs from 'fs';
import * as path from 'path';
import { timestamp } from 'sparklet/main/services/logger/logger-format.js';
import {
  getCoreDir,
  getModulesDir,
  moduleMap,
  warnedUnknown,
} from 'sparklet/main/services/logger/logger-path-store.js';

/** Resolve the log file path for a scope [按 scope 解析日志文件路径] */
export function resolve(scope: string): { dir: string; file: string } {
  // Core = main process, the hub module, and any hub.* sub-scope
  // (e.g. hub.welcome) — all land in sparklet.main/kernel/kernel.log.
  // [核心 = 主进程、hub 模块及任何 hub.* 子 scope (如 hub.welcome)，
  //  统一写入 sparklet.main/kernel/kernel.log]
  const isCore = !scope || scope === 'main' || scope === 'hub' || scope.startsWith('hub.');
  if (isCore) {
    const dir = getCoreDir();
    return { dir, file: path.join(dir, 'kernel.log') };
  }
  const code = moduleMap[scope];
  if (code) {
    const dir = path.join(getModulesDir(), code);
    return { dir, file: path.join(dir, `${code}.log`) };
  }
  // Unknown module: keep it out of the coded namespace under _unknown/[未登记模块：放到 _unknown/ 下并提醒]
  if (!warnedUnknown.has(scope)) {
    warnedUnknown.add(scope);
    try { fs.appendFileSync(path.join(getCoreDir(), 'kernel.log'),
      `[${timestamp(new Date())}] [WARN ] [logger] Unknown module scope "${scope}" — add it to logger-manifest.json\n`); } catch { /* ignore */ }
  }
  const dir = path.join(getModulesDir(), '_unknown', scope);
  return { dir, file: path.join(dir, `${scope}.log`) };
}
