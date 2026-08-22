// Project IPC handlers [项目 IPC 处理器]

import { ipcMain } from 'electron';
import { openFolderDialog, readDirectoryTree } from '../services/project-service';

/**
 * Register project IPC handlers [注册项目 IPC 处理器]
 */
export function registerProjectIpcHandlers(): void {
  // Open folder selection dialog [打开文件夹选择对话框]
  ipcMain.handle('project:open-folder', async () => {
    return openFolderDialog();
  });

  // Read directory tree [读取目录树]
  ipcMain.handle('project:read-tree', async (_event, dirPath: string) => {
    return readDirectoryTree(dirPath);
  });
}
