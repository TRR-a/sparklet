// Logger: initialization (dirs, rotation, level, session banner) [日志 - 初始化 (目录、轮转、级别、会话横幅)]

import { app } from 'electron';
import * as path from 'path';
import { LEVEL_WEIGHT } from './logger-format.js';
import { initLogPaths, getCoreDir, getModulesDir, getModuleCodes, getRawLogRoot } from './logger-paths.js';
import { rotateIfNeeded } from './logger-rotate.js';
import { setLoggerReady, setMinWeight } from './logger-state.js';
import { write } from './logger-write-line.js';

/** Set up directories, rotate oversized files, pick the level [初始化目录、轮转并确定级别] */
export function initLogger(): void {
  initLogPaths();
  setMinWeight(app.isPackaged ? LEVEL_WEIGHT.info : LEVEL_WEIGHT.debug);

  // Rotate core + every registered module file at startup [启动时轮转核心与每个已登记模块文件]
  const coreDir = getCoreDir();
  rotateIfNeeded(coreDir, path.join(coreDir, 'kernel.log'), 'kernel');
  for (const code of getModuleCodes()) {
    const dir = path.join(getModulesDir(), code);
    rotateIfNeeded(dir, path.join(dir, `${code}.log`), code);
  }

  setLoggerReady(true);

  // Session banner: separator + rich header, so each launch is easy to spot
  // when browsing the file [会话横幅：分隔线+富信息头，翻日志时一眼定位每次启动]
  write('info', 'main', 'logger', '────────────────────────────────────────');
  write('info', 'main', 'logger',
    `Session start: Sparklet v${app.getVersion()} · Electron ${process.versions.electron} · ` +
    `${process.platform}-${process.arch} · packaged=${app.isPackaged} · pid=${process.pid}`);
  write('info', 'main', 'logger',
    `Logger ready (level=${app.isPackaged ? 'info' : 'debug'}, root=${getRawLogRoot()})`);
}
