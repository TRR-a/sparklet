// Main window: the official Main UI (notes, projects, settings) [主窗口：官方 Main 界面 (笔记、项目、设置)]
// The Main module now ships inside the kernel bundle — opened directly by the kernel.
// [Main 模块现已随内核包一同发布——由内核直接打开]

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { getMainWindow, setMainWindow, syncGlowPosition } from './window-manager';

// Preload script path (relative to build/src/hub/main/windows) [Preload 脚本路径]
const PRELOAD_PATH = path.join(__dirname, '../../core/preload/index.js');

// Main HTML path (build/src/hub/main/popup/popup.html) [Main HTML 路径]
const MAIN_HTML = path.join(__dirname, '../popup/popup.html');

// Icon path [图标路径]
const ICON_PATH = path.join(__dirname, '../../../assets/icons/icon128.png');

/**
 * Create the official Main window (single instance) [创建官方 Main 窗口 (单实例)]
 */
export function createMainWindow(): void {
  const existing = getMainWindow();
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return;
  }

  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 400,
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
  setMainWindow(win);

  win.loadFile(MAIN_HTML);
  win.once('ready-to-show', () => {
    win.show();
  });
  win.on('closed', () => setMainWindow(null));
  win.on('move', () => syncGlowPosition());
}
