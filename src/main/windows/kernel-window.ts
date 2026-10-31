// Kernel window: the microkernel's own Hub UI [内核窗口：微内核自身的 Hub 界面]
// The kernel window is the only window created at startup. It renders the Hub
// and opens official windows (Main, settings, about) on demand.
// [内核窗口是启动时创建的唯一窗口。它渲染 Hub 界面，并按需打开官方窗口
// (Main、设置、关于)]

import { BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { setKernelWindow } from './window-manager';

// Preload script path (relative to build/src/main/windows) [Preload 脚本路径]
const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');

// Kernel HTML path (build/src/renderer/kernel/kernel/kernel.html) [内核 HTML 路径]
const KERNEL_HTML = path.join(__dirname, '../../renderer/kernel/kernel/kernel.html');

// Icon path [图标路径]
const ICON_PATH = path.join(__dirname, '../../../assets/icons/icon128.png');

/**
 * Create the kernel (Hub) window [创建内核 (Hub) 窗口]
 */
export function createKernelWindow(): void {
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
  setKernelWindow(win);

  win.loadFile(KERNEL_HTML);
  win.once('ready-to-show', () => {
    win.show();
  });
  win.on('closed', () => setKernelWindow(null));

  // Sync maximize state to renderer for border-radius handling [同步最大化状态给渲染进程以处理圆角]
  const sendMaxState = (maximized: boolean) => {
    if (!win.isDestroyed()) win.webContents.send('window:maximize-state', { maximized });
  };
  win.on('maximize', () => sendMaxState(true));
  win.on('unmaximize', () => sendMaxState(false));
  win.once('ready-to-show', () => sendMaxState(win.isMaximized()));
}
