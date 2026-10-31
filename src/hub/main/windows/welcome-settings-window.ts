// Hub settings window creation [Hub 设置窗口创建]

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { getWelcomeWindow } from './window-manager.js';

const PRELOAD_PATH = path.join(__dirname, '../../core/preload/index.js');
const WELCOME_SETTINGS_HTML = path.join(__dirname, '../../welcome/settings/welcome-settings.html');

/** Single instance reference [单例引用] */
let hubSettingsWindow: BrowserWindow | null = null;

/**
 * Compute whether the settings window overlaps the welcome window and notify
 * the hub renderer so it can blur/unblur its content.
 * [计算设置窗口是否与 Welcome 窗口重叠并通知 Hub 渲染层虚化/解除]
 */
function syncHubOverlap(): void {
  const hub = getWelcomeWindow();
  if (!hub || hub.isDestroyed() || !hubSettingsWindow || hubSettingsWindow.isDestroyed()) return;
  const h = hub.getBounds();
  const s = hubSettingsWindow.getBounds();
  const overlapping = !(
    s.x + s.width < h.x ||
    s.x > h.x + h.width ||
    s.y + s.height < h.y ||
    s.y > h.y + h.height
  );
  hub.webContents.send('welcome-settings-overlap', overlapping);
}

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
    syncHubOverlap();
  });
  hubSettingsWindow.on('move', syncHubOverlap);
  hubSettingsWindow.on('minimize', () => {
    const hub = getWelcomeWindow();
    if (hub && !hub.isDestroyed()) hub.webContents.send('welcome-settings-overlap', false);
  });
  hubSettingsWindow.on('restore', syncHubOverlap);
  hubSettingsWindow.on('closed', () => {
    hubSettingsWindow = null;
    const hub = getWelcomeWindow();
    if (hub && !hub.isDestroyed()) hub.webContents.send('welcome-settings-overlap', false);
  });
}
