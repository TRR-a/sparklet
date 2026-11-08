// Installer: spawn external updater [安装器 - 启动外部更新器]

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getUpdaterScriptPath } from '../startup/updater-paths.js';
import type { InstallResult } from 'sparklet/shared/types/updater/updater.js';
import { prepareUpdaterLogFile } from './installer-log-file.js';

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

  const logFile = await prepareUpdaterLogFile(targetVersion);

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
