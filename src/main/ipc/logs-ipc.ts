// Logs IPC handlers [日志 IPC 处理器]
// Lets the kernel UI open the logs folder and tail recent kernel.log lines
// [供内核 UI 打开日志文件夹并读取 kernel.log 尾部内容]

import { ipcMain, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { getLogRoot, logger } from '../services/logger';

/**
 * Register logs IPC handlers [注册日志 IPC 处理器]
 */
export function registerLogsIpcHandlers(): void {
  // Open the logs folder in the system file manager [在系统文件管理器中打开日志文件夹]
  ipcMain.handle('logs:open-folder', async () => {
    const root = getLogRoot();
    try {
      fs.mkdirSync(root, { recursive: true });
      await shell.openPath(root);
      return { success: true, root };
    } catch (err) {
      logger.warn('main', `Failed to open logs folder: ${String(err)}`);
      return { success: false, error: String(err) };
    }
  });

  // Tail the main kernel.log (last N lines, defaults to 200) [读取 kernel.log 尾部 N 行，默认 200 行]
  ipcMain.handle('logs:tail', async (_event, maxLines = 200) => {
    const file = path.join(getLogRoot(), 'kernel', 'kernel.log');
    try {
      if (!fs.existsSync(file)) return { success: true, lines: [] as string[] };
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      const tail = lines.slice(-Math.max(1, maxLines));
      return { success: true, lines: tail, file };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}
