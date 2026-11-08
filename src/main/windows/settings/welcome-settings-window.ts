// Hub settings window creation [Hub 设置窗口创建]
// Overlap sync in welcome-settings-overlap.ts [重叠同步在 welcome-settings-overlap.ts]

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { syncHubOverlap, clearHubOverlap } from './welcome-settings-overlap.js';

const PRELOAD_PATH = path.join(__dirname, '../../../preload/index.js');
const WELCOME_SETTINGS_HTML = path.join(__dirname, '../../../renderer/welcome/settings/welcome-settings.html');

/** Single instance reference [单例引用] */
let hubSettingsWindow: BrowserWindow | null = null;

/**
 * Create the hub settings window (single instance) [创建 Hub 设置窗口 (单实例)]
 */
export function createWelcomeSettingsWindow(): void {
  if (hubSettingsWindow && !hubSettingsWindow.isDestroyed()) {
    if (hubSettingsWindow.isMinimized()) hubSettingsWindow.restore();
    hubSettingsWindow.moveTop();
    hubSettingsWindow.focus();
    return;
  }

  hubSettingsWindow = new BrowserWindow({
    width: 400,
    height: 560,
    frame: false,
    titleBarStyle: 'hidden',
    transparent: true,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
    },
    show: false,
  });

  void hubSettingsWindow.loadFile(WELCOME_SETTINGS_HTML);
  hubSettingsWindow.once('ready-to-show', () => {
    hubSettingsWindow?.show();
    syncHubOverlap(hubSettingsWindow);
  });
  hubSettingsWindow.on('move', () => syncHubOverlap(hubSettingsWindow));
  hubSettingsWindow.on('minimize', clearHubOverlap);
  hubSettingsWindow.on('restore', () => syncHubOverlap(hubSettingsWindow));
  hubSettingsWindow.on('closed', () => {
    hubSettingsWindow = null;
    clearHubOverlap();
  });
}
