// About window creation [关于窗口创建]

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { setAboutWindow, getAboutWindow } from './window-manager';

// Preload script path [Preload 脚本路径]
const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');

// About HTML path [About HTML 路径]
const ABOUT_HTML = path.join(__dirname, '../../renderer/modules/note/about/about.html');

/**
 * Create the about window (single instance) [创建关于窗口 (单实例)]
 */
export function createAboutWindow(): void {
  const existing = getAboutWindow();
  if (existing) {
    existing.moveTop();
    existing.focus();
    return;
  }
  const aboutWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    titleBarStyle: 'hidden',
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH
    },
    show: false
  });
  setAboutWindow(aboutWindow);

  aboutWindow.loadFile(ABOUT_HTML);
  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
    aboutWindow.moveTop();
  });
  aboutWindow.on('closed', () => setAboutWindow(null));
}
