// Installer: always dispatch external updater (directReplace removed: asar archives are read-only and cannot be patched in-place inside a running app; all updates apply after main quits) [安装器：始终调度外部更新器 (directReplace 已移除：asar 归档是只读的，无法在运行中的应用内原地打补丁；所有更新在主进程退出后应用)]
//
// Split out [已拆分]：log file path → installer-log-file.ts,
// external process spawn → installer-spawn.ts.

import type { InstallResult } from 'sparklet/shared/types/updater/updater.js';
import { runExternalUpdater } from 'sparklet/main/updater/install/installer-spawn.js';

export { runExternalUpdater } from 'sparklet/main/updater/install/installer-spawn.js';

/** Progress callback type [进度回调类型] */
type ProgressCallback = (msg: string, percent: number) => void;

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
