// Installer: updater log file path [安装器 - 更新器日志文件路径]

import * as fs from 'fs-extra';
import * as path from 'path';
import { app } from 'electron';

/**
 * Build the persistent updater log path (inside userData so user can find it easily)
 * [构建持久化更新器日志路径 (放在 userData 内，方便用户查找)]
 */
export async function prepareUpdaterLogFile(targetVersion: string): Promise<string> {
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
  return logFile;
}
