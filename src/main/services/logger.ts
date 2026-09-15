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

/** Set when the stdout/stderr pipe breaks; console mirroring is then off for good [控制台管道断裂后永久停用镜像] */
let consoleBroken = false;

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

  // Session banner: separator + rich header, so each launch is easy to spot
  // when browsing the file [会话横幅：分隔线+富信息头，翻日志时一眼定位每次启动]
  write('info', 'main', 'logger', '────────────────────────────────────────');
  write('info', 'main', 'logger',
    `Session start: Sparklet v${app.getVersion()} · Electron ${process.versions.electron} · ` +
    `${process.platform}-${process.arch} · packaged=${app.isPackaged} · pid=${process.pid}`);
  write('info', 'main', 'logger',
    `Logger ready (level=${app.isPackaged ? 'info' : 'debug'}, root=${logRoot})`);
}

/** Serialize an Error with its stack, anything else via String [Error 连堆栈序列化，其余走 String] */
export function errText(err: unknown): string {
  if (err instanceof Error) return err.stack || `${err.name}: ${err.message}`;
  return String(err);
}

/**
 * Install crash & fatal-error capture: main-process exceptions, renderer process
 * loss, child (GPU/utility) process loss, and a session-end marker. Everything
 * goes to the log only — no native dialogs — so the file tells the whole story
 * of a session after the fact.
 * [安装崩溃与致命错误捕获：主进程异常、渲染进程退出、子进程 (GPU等) 退出与会话结束标记。
 *  仅落盘不弹原生对话框，事后日志可还原整个会话的完整故事线]
 */
export function installCrashLogging(): void {
  const uptime = () => `uptime ${Math.round(process.uptime())}s`;
  process.on('uncaughtException', (err) => {
    // Broken stdout/stderr pipe (parent terminal closed): the console mirror is
    // now impossible — disable it or every mirrored write throws EPIPE again
    // and the handler recurses forever. [控制台管道已断 (父终端关闭)：镜像已不可能，
    // 必须停用，否则每次镜像写入都会再抛 EPIPE，处理器无限递归]
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'EPIPE' || code === 'EIO') {
      consoleBroken = true;
      write('warn', 'main', 'logger', `Console pipe broken (${code}); console mirror disabled`);
      return;
    }
    write('error', 'main', 'crash', `Uncaught exception (${uptime()}):\n${errText(err)}`);
  });
  process.on('unhandledRejection', (reason) => {
    write('error', 'main', 'crash', `Unhandled rejection (${uptime()}):\n${errText(reason)}`);
  });
  app.on('render-process-gone', (_event, _webContents, details) => {
    write('error', 'main', 'crash', `Renderer process gone (${uptime()}): reason=${details.reason} exitCode=${details.exitCode}`);
  });
  app.on('child-process-gone', (_event, details) => {
    write('warn', 'main', 'crash', `Child process gone: type=${details.type} reason=${details.reason}`);
  });
  app.on('before-quit', () => {
    write('info', 'main', 'logger', `Session end (uptime ${Math.round(process.uptime())}s)`);
  });
}

function write(level: LogLevel, scope: string, tag: string, message: string): void {
  if (!ready || LEVEL_WEIGHT[level] < minWeight) return;
  const { dir, file } = resolve(scope);
  // Multi-line messages (stack traces): continuation lines are indented to the
  // message column so one entry stays visually one block [多行消息 (堆栈)：续行缩进到
  // 正文列，单条日志在视觉上仍是一个整体]
  const prefix = `[${timestamp(new Date())}] [${level.toUpperCase().padEnd(5)}] [${tag}] `;
  const body = message.split('\n').join(`\n${' '.repeat(prefix.length)}`);
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(file, prefix + body + '\n');
  } catch { /* never let logging crash the app [日志写入失败绝不影响应用] */ }
  if (!consoleBroken) {
    const out = level === 'debug' ? console.log : console[level];
    try { out(`[${tag}] ${message}`); } catch { /* ignore console failures [控制台失败忽略] */ }
  }
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

/** Absolute path of the logs root (<userData>/logs/sparklet.main/) [日志根目录绝对路径 (<userData>/logs/sparklet.main/)] */
export function getLogRoot(): string {
  return path.join(logRoot, 'sparklet.main');
}
