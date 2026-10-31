// Hub settings window creation [Hub 设置窗口创建]

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { getHubWindow } from './window-manager.js';

const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');
const HUB_SETTINGS_HTML = path.join(__dirname, '../../renderer/kernel/hub/settings/hub-settings.html');

/** Single instance reference [单例引用] */
let hubSettingsWindow: BrowserWindow | null = null;

/**
 * Compute whether the settings window overlaps the hub window and notify
 * the hub renderer so it can blur/unblur its content.
 * [计算设置窗口是否与 Hub 窗口重叠并通知 Hub 渲染层虚化/解除]
 */
function syncHubOverlap(): void {
  const hub = getHubWindow();
  if (!hub || hub.isDestroyed() || !hubSettingsWindow || hubSettingsWindow.isDestroyed()) return;
  const h = hub.getBounds();
  const s = hubSettingsWindow.getBounds();
  const overlapping = !(
    s.x + s.width < h.x ||
    s.x > h.x + h.width ||
    s.y + s.height < h.y ||
    s.y > h.y + h.height
  );
  hub.webContents.send('hub-settings-overlap', overlapping);
}

/**
 * Create the hub settings window (single instance) [创建 Hub 设置窗口 (单实例)]
 */
export function createHubSettingsWindow(): void {
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

  void hubSettingsWindow.loadFile(HUB_SETTINGS_HTML);
  hubSettingsWindow.once('ready-to-show', () => {
    hubSettingsWindow?.show();
    syncHubOverlap();
  });
  hubSettingsWindow.on('move', syncHubOverlap);
  hubSettingsWindow.on('minimize', () => {
    const hub = getHubWindow();
    if (hub && !hub.isDestroyed()) hub.webContents.send('hub-settings-overlap', false);
  });
  hubSettingsWindow.on('restore', syncHubOverlap);
  hubSettingsWindow.on('closed', () => {
    hubSettingsWindow = null;
    const hub = getHubWindow();
    if (hub && !hub.isDestroyed()) hub.webContents.send('hub-settings-overlap', false);
  });
}
