// Settings window: BrowserWindow options [设置窗口 - 窗口参数]

import * as path from 'path';
import type { BrowserWindowConstructorOptions } from 'electron';

// Preload script path [Preload 脚本路径]
export const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');

// Settings HTML path [Settings HTML 路径]
export const SETTINGS_HTML = path.join(__dirname, '../../renderer/app/settings/settings.html');

/** Build the frameless, transparent settings window options [构造无边框透明设置窗口参数] */
export function buildSettingsWindowOptions(): BrowserWindowConstructorOptions {
  return {
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
  };
}
