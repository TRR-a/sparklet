// Settings window creation [设置窗口创建]

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { setSettingsWindow, getSettingsWindow, getMainWindow, syncGlowPosition } from './window-manager';

// Preload script path [Preload 脚本路径]
const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');

// Settings HTML path [Settings HTML 路径]
const SETTINGS_HTML = path.join(__dirname, '../../renderer/modules/note/settings/settings.html');

/**
 * Create the settings window (single instance) [创建设置窗口 (单实例)]
 */
export function createSettingsWindow(): void {
  const existing = getSettingsWindow();
  if (existing) {
    if (existing.isMinimized()) existing.restore();
    existing.moveTop();
    existing.focus();
    return;
  }
  const settingsWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    titleBarStyle: 'hidden',
    transparent: true,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH
    },
    show: false
  });
  setSettingsWindow(settingsWindow);

  settingsWindow.loadFile(SETTINGS_HTML);
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
