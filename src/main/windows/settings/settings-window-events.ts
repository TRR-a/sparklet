// Settings window: lifecycle events [设置窗口 - 生命周期事件]

import { BrowserWindow } from 'electron';
import { setSettingsWindow, getMainWindow, syncGlowPosition } from '../window-manager.js';

/** Wire show/move/minimize/restore/closed handlers [接线显示/移动/最小化/还原/关闭处理] */
export function bindSettingsWindowEvents(settingsWindow: BrowserWindow): void {
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    syncGlowPosition();
  });
  settingsWindow.on('move', syncGlowPosition);
  settingsWindow.on('minimize', () => {
    getMainWindow()?.webContents.send('settings-window-minimized');
  });
  settingsWindow.on('restore', () => {
    getMainWindow()?.webContents.send('settings-window-restored');
    syncGlowPosition();
  });
  settingsWindow.on('closed', () => {
    setSettingsWindow(null);
    getMainWindow()?.webContents.send('settings-window-closed');
  });
}
