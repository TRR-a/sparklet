// Main window creation [主窗口创建]

import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { setMainWindow, getSettingsWindow, syncGlowPosition } from './window-manager';
import { getCurrentVersion } from '../updater/check';
import * as cacheManager from '../updater/cache-manager';
import { CACHE_SUCCESS_MARK_DELAY_MS } from '../updater/constants';

// Preload script path (relative to this file at src/main/windows/) [Preload 脚本路径 (相对于本文件 src/main/windows/)]
const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');

// Popup HTML path [Popup HTML 路径]
const POPUP_HTML = path.join(__dirname, '../../renderer/modules/note/popup/popup.html');

// Icon path [图标路径]
const ICON_PATH = path.join(__dirname, '../../../assets/icons/icon128.png');

/**
 * Create the main application window [创建主应用窗口]
 */
export function createMainWindow(): void {
  Menu.setApplicationMenu(null);
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    icon: ICON_PATH,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH
    },
    show: false
  });
  setMainWindow(mainWindow);

  mainWindow.loadFile(POPUP_HTML);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    setTimeout(async () => {
      try {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (!app.isPackaged) return;
        const currentVersion = getCurrentVersion();
        await cacheManager.markSuccessFirstLaunch(`v${currentVersion}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[Main] markSuccessFirstLaunch failed (non-critical):', msg);
      }
    }, CACHE_SUCCESS_MARK_DELAY_MS);
  });
  mainWindow.on('focus', () => {
    const settingsWindow = getSettingsWindow();
    if (settingsWindow && !settingsWindow.isDestroyed() && !settingsWindow.isMinimized()) {
      settingsWindow.moveTop();
    }
  });
  mainWindow.on('move', syncGlowPosition);
  mainWindow.on('resize', syncGlowPosition);
  mainWindow.on('closed', () => setMainWindow(null));
}
