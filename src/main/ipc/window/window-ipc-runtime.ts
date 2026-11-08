// Window IPC: runtime versions channel [窗口 IPC - 运行时版本通道]

import { ipcMain } from 'electron';

/** Register runtime version query handler [注册运行时版本查询处理器] */
export function registerRuntimeVersionsIpc(): void {
  // ========== Runtime versions (about panel) [运行时版本 (关于面板)] ==========
  ipcMain.handle('get-runtime-versions', () => ({
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  }));
}
