// Settings window creation [璁剧疆绐楀彛鍒涘缓]

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { setSettingsWindow, getSettingsWindow, getMainWindow, syncGlowPosition } from './window-manager';

// Preload script path [Preload 鑴氭湰璺緞]
const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');

// Settings HTML path [Settings HTML 璺緞]
const SETTINGS_HTML = path.join(__dirname, '../../../modules/note/settings/settings.html');

/**
 * Create the settings window (single instance) [鍒涘缓璁剧疆绐楀彛 (鍗曞疄渚?]
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
