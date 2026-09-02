// Kernel window: the microkernel's own Hub UI (no plugins required) [内核窗口：微内核自身的 Hub 界面 (无需任何插件)]
// The kernel window is the only window created at startup. It lists detected
// plugins and opens them on demand. It renders even when zero plugins are
// installed (empty state), so the app always has a usable home screen.
// [内核窗口是启动时创建的唯一窗口。它列出检测到的插件并按需打开。即使零插件
// 也正常渲染 (空状态)，保证应用始终有可用的主界面]

import { BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { setKernelWindow } from './window-manager';

// Preload script path (relative to build/src/main/windows) [Preload 脚本路径]
const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');

// Kernel HTML path (build/src/renderer/kernel/kernel.html) [内核 HTML 路径]
const KERNEL_HTML = path.join(__dirname, '../../renderer/kernel/kernel.html');

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
}
