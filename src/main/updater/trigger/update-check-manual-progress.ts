// Update check: manual progress forwarding [更新检查 - 手动进度转发]

import { BrowserWindow } from 'electron';

/** Progress callback that forwards to the focused window [把进度转发到聚焦窗口的回调] */
export function reportManualProgress(
  win: BrowserWindow | null
): (msg: string, percent: number) => void {
  return (msg, percent) => {
    console.log(`[Updater] Manual progress: ${msg} (${percent}%)`);
    if (win) {
      win.webContents.send('updater:progress', { msg, percent });
    }
  };
}
