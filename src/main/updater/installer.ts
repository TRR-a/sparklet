// Installer: always dispatch external updater (directReplace removed: asar archives are read-only and cannot be patched in-place inside a running app; all updates apply after main quits) [安装器：始终调度外部更新器 (directReplace 已移除：asar 归档是只读的，无法在运行中的应用内原地打补丁；所有更新在主进程退出后应用)]

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { app } from 'electron';
import { getUpdaterScriptPath, getTempPath } from './constants';
import type { InstallResult } from '../../shared/types/updater';

/** Progress callback type [进度回调类型] */
type ProgressCallback = (msg: string, percent: number) => void;

/**
 * Run external updater process [运行外部更新器进程]
 * @param zipPath Update package zip path [更新包 zip 路径]
 * @param tempDir Temp directory path [临时目录路径]
 * @param targetVersion Target version string [目标版本号]
 * @returns Install result [安装结果]
 */
export async function runExternalUpdater(zipPath: string, tempDir: string, targetVersion: string): Promise<InstallResult> {
  const updaterScript = getUpdaterScriptPath();
  const exists = await fs.pathExists(updaterScript);
  if (!exists) {
    console.error('[Installer] Updater script not found:', updaterScript);
    return { success: false, error: `Updater script not found: ${updaterScript}` };
  }

  // Prepare persistent log location (inside userData so user can find it easily) [准备持久化日志位置 (放在 userData 内，方便用户查找)]
  const logDir = path.join(app.getPath('userData'), 'update_logs');
  await fs.ensureDir(logDir);
  const ts = new Date();
  const tsStr =
    ts.getFullYear().toString()
    + String(ts.getMonth() + 1).padStart(2, '0')
    + String(ts.getDate()).padStart(2, '0') + '-'
    + String(ts.getHours()).padStart(2, '0')
    + String(ts.getMinutes()).padStart(2, '0')
    + String(ts.getSeconds()).padStart(2, '0');
  const safeVersion = (targetVersion || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  const logFile = path.join(logDir, `updater-${safeVersion}-${tsStr}.log`);
  console.log('[Installer] Updater log will be written to:', logFile);

  console.log('[Installer] Starting external updater:', updaterScript);
  return new Promise<InstallResult>((resolve) => {
    // ELECTRON_RUN_AS_NODE=1 lets the packaged Electron exe run js files in pure Node mode [ELECTRON_RUN_AS_NODE=1 让 Electron 打包后的 exe 以纯 Node 模式运行 js 文件]
    const nodeProcess = spawn(process.execPath, [
      updaterScript,
      '--zip', zipPath,
      '--temp', tempDir,
      '--version', targetVersion,
      '--pid', String(process.pid),
      '--log-file', logFile
    ], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      cwd: path.dirname(process.execPath)
    });
    nodeProcess.unref();
    setTimeout(() => {
      console.log('[Installer] External updater started, main process will exit');
      resolve({ success: true, error: null, logFile });
    }, 1000);
  });
}

/**
 * Install update (always uses external updater, asar-safe) [安装更新 (始终使用外部更新器，asar 安全)]
 * @param zipPath Update package zip path [更新包 zip 路径]
 * @param tempDir Temp directory path [临时目录路径]
 * @param targetVersion Target version string [目标版本号]
 * @param onProgress Optional progress callback [可选的进度回调]
 * @returns Install result [安装结果]
 */
export async function installUpdate(zipPath: string, tempDir: string, targetVersion: string, onProgress: ProgressCallback | null = null): Promise<InstallResult> {
  onProgress && onProgress('Starting external updater...', 50);
  console.log('[Installer] Package analysis skipped, always using external updater (asar-safe)');
  return runExternalUpdater(zipPath, tempDir, targetVersion);
}
