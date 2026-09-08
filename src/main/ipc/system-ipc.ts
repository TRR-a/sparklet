// System monitor IPC: serve CPU/memory/disk/GPU stats to the kernel UI [系统监控 IPC：向内核 UI 提供 CPU/内存/磁盘/GPU 状态]

import { ipcMain } from 'electron';
import { getSystemStats } from '../kernel/system-monitor';

/**
 * Register system-stats IPC handlers [注册系统状态 IPC 处理器]
 */
export function registerSystemIpcHandlers(): void {
  ipcMain.handle('system:stats', () => getSystemStats());
}
