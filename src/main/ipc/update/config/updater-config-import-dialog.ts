// Updater config import: file picker dialog [更新配置导入 - 文件选择弹窗]

import { dialog, BrowserWindow } from 'electron';

/**
 * Open the JSON config file picker [打开 JSON 配置文件选择框]
 * @returns Chosen file path, or null when canceled [选中的文件路径，取消时为 null]
 */
export async function pickConfigFileForImport(): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: '导入更新配置',
    properties: ['openFile'],
    filters: [{ name: 'JSON 配置', extensions: ['json'] }]
  });
  if (canceled || !filePaths || filePaths.length === 0) return null;
  return filePaths[0];
}
