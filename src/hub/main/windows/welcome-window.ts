// Welcome window: the microkernel's own Hub UI [Welcome 窗口：微内核自身的界面]
// The welcome window is the only window created at startup. It renders the Hub
// and opens official windows (Main, settings, about) on demand.
// [Welcome 窗口是启动时创建的唯一窗口。它渲染 Hub 界面，并按需打开官方窗口
// (Main、设置、关于)]

import { BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { setWelcomeWindow } from './window-manager';

// Preload script path (relative to build/src/hub/main/windows) [Preload 脚本路径]
const PRELOAD_PATH = path.join(__dirname, '../../core/preload/index.js');

// Welcome HTML path (build/src/hub/welcome/welcome.html) [Welcome HTML 路径]
const WELCOME_HTML = path.join(__dirname, '../../welcome/welcome.html');

// Icon path [图标路径]
const ICON_PATH = path.join(__dirname, '../../../assets/icons/icon128.png');

/**
 * Create the Welcome window [创建 Welcome 窗口]
 */
export function createWelcomeWindow(): void {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
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
  setWelcomeWindow(win);

  win.loadFile(WELCOME_HTML);
  win.once('ready-to-show', () => {
    win.show();
  });
  win.on('closed', () => setWelcomeWindow(null));

  // Sync maximize state to renderer for border-radius handling [同步最大化状态给渲染进程以处理圆角]
  const sendMaxState = (maximized: boolean) => {
    if (!win.isDestroyed()) win.webContents.send('window:maximize-state', { maximized });
  };
  win.on('maximize', () => sendMaxState(true));
  win.on('unmaximize', () => sendMaxState(false));
  win.once('ready-to-show', () => sendMaxState(win.isMaximized()));
}
