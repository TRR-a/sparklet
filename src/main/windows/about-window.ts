// About window creation [鍏充簬绐楀彛鍒涘缓]

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { setAboutWindow, getAboutWindow } from './window-manager';

// Preload script path [Preload 鑴氭湰璺緞]
const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');

// About HTML path [About HTML 璺緞]
const ABOUT_HTML = path.join(__dirname, '../../../modules/note/about/about.html');

/**
 * Create the about window (single instance) [鍒涘缓鍏充簬绐楀彛 (鍗曞疄渚?]
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
