// Config change broadcast [配置变化广播]

import { BrowserWindow } from 'electron';
import type { UpdaterConfig } from 'sparklet/shared/types/updater/updater.js';

/**
 * Broadcast config change to all windows [广播配置变化到所有窗口]
 */
export function broadcastConfigChange(config: UpdaterConfig): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('config:changed', config);
    }
  }
  console.log('[ConfigManager] Config change broadcast to all windows');
}
