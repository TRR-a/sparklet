// File logger for the main process [主进程文件日志]
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

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import manifest from './logger-manifest.json';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB rotation threshold per file [每个文件 5 MB 轮转阈值]
const MAX_BACKUPS = 5;

let logRoot = '';
let modulesDir = '';
let minWeight = LEVEL_WEIGHT.info;
let ready = false;

const moduleMap: Record<string, string> = (manifest && manifest.map) || {};
const warnedUnknown = new Set<string>();

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

function timestamp(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

/** Resolve the log file path for a scope [按 scope 解析日志文件路径] */
function resolve(scope: string): { dir: string; file: string } {
  const isCore = !scope || scope === 'main' || scope === 'kernel';
  if (isCore) {
    const dir = path.join(logRoot, 'sparklet.main', 'kernel');
    return { dir, file: path.join(dir, 'kernel.log') };
  }
  const code = moduleMap[scope];
  if (code) {
    const dir = path.join(logRoot, 'sparklet.main', 'modules', code);
    return { dir, file: path.join(dir, `${code}.log`) };
  }
  // Unknown module: keep it out of the coded namespace under _unknown/[未登记模块：放到 _unknown/ 下并提醒]
  if (!warnedUnknown.has(scope)) {
    warnedUnknown.add(scope);
    try { fs.appendFileSync(path.join(logRoot, 'sparklet.main', 'kernel', 'kernel.log'),
      `[${timestamp(new Date())}] [WARN ] [logger] Unknown module scope "${scope}" — add it to logger-manifest.json\n`); } catch { /* ignore */ }
  }
  const dir = path.join(logRoot, 'sparklet.main', 'modules', '_unknown', scope);
  return { dir, file: path.join(dir, `${scope}.log`) };
}

/** Rotate one file if it exceeds MAX_BYTES, prune old backups [单文件超限则轮转并清理旧备份] */
function rotateIfNeeded(dir: string, file: string, backupPrefix: string): void {
  try {
    if (!fs.existsSync(file) || fs.statSync(file).size <= MAX_BYTES) return;
    fs.renameSync(file, path.join(dir, `${backupPrefix}.${Date.now()}.log`));
    const old = fs.readdirSync(dir)
      .filter((f) => new RegExp(`^${backupPrefix}\\.[0-9]+\\.log$`).test(f))
      .sort()
      .reverse();
    for (const f of old.slice(MAX_BACKUPS)) {
      try { fs.unlinkSync(path.join(dir, f)); } catch { /* ignore */ }
    }
  } catch { /* best effort [尽力而为] */ }
}

/** Set up directories, rotate oversized files, pick the level [初始化目录、轮转并确定级别] */
export function initLogger(): void {
  logRoot = path.join(app.getPath('userData'), 'logs');
  modulesDir = path.join(logRoot, 'sparklet.main', 'modules');
  const coreDir = path.join(logRoot, 'sparklet.main', 'kernel');
  fs.mkdirSync(coreDir, { recursive: true });
  fs.mkdirSync(modulesDir, { recursive: true });
  minWeight = app.isPackaged ? LEVEL_WEIGHT.info : LEVEL_WEIGHT.debug;

  // Rotate core + every registered module file at startup [启动时轮转核心与每个已登记模块文件]
  rotateIfNeeded(coreDir, path.join(coreDir, 'kernel.log'), 'kernel');
  for (const code of new Set(Object.values(moduleMap))) {
    const dir = path.join(modulesDir, code);
    rotateIfNeeded(dir, path.join(dir, `${code}.log`), code);
  }

  ready = true;
  write('info', 'main', 'logger', `Logger ready (level=${app.isPackaged ? 'info' : 'debug'}, root=${logRoot})`);
}

function write(level: LogLevel, scope: string, tag: string, message: string): void {
  if (!ready || LEVEL_WEIGHT[level] < minWeight) return;
  const { dir, file } = resolve(scope);
  const line = `[${timestamp(new Date())}] [${level.toUpperCase().padEnd(5)}] [${tag}] ${message}\n`;
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(file, line);
  } catch { /* never let logging crash the app [日志写入失败绝不影响应用] */ }
  const out = level === 'debug' ? console.log : console[level];
  out(`[${tag}] ${message}`);
}

/** Leveled logger for main-process code; always writes to the core folder [主进程分级 logger，固定写入核心目录] */
export const logger = {
  debug: (tag: string, message: string): void => write('debug', 'main', tag, message),
  info: (tag: string, message: string): void => write('info', 'main', tag, message),
  warn: (tag: string, message: string): void => write('warn', 'main', tag, message),
  error: (tag: string, message: string): void => write('error', 'main', tag, message),
};

/** Write a log line on behalf of a module scope (used by the renderer IPC bridge) [代指定模块 scope 写日志 (供渲染 IPC 桥调用)] */
export function writeScoped(level: LogLevel, scope: string, tag: string, message: string): void {
  write(level, scope || 'main', tag, message);
}
