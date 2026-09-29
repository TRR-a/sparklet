// Kernel settings window creation [内核设置窗口创建]

import { BrowserWindow } from 'electron';
import * as path from 'path';
import { getKernelWindow } from './window-manager.js';

const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');
const KERNEL_SETTINGS_HTML = path.join(__dirname, '../../renderer/kernel/settings/kernel-settings.html');

/** Single instance reference [单例引用] */
let kernelSettingsWindow: BrowserWindow | null = null;

/**
 * Compute whether the settings window overlaps the kernel window and notify
 * the kernel renderer so it can blur/unblur its content.
 * [计算设置窗口是否与内核窗口重叠并通知内核渲染层虚化/解除]
 */
function syncKernelOverlap(): void {
  const kernel = getKernelWindow();
  if (!kernel || kernel.isDestroyed() || !kernelSettingsWindow || kernelSettingsWindow.isDestroyed()) return;
  const k = kernel.getBounds();
  const s = kernelSettingsWindow.getBounds();
  const overlapping = !(
    s.x + s.width < k.x ||
    s.x > k.x + k.width ||
    s.y + s.height < k.y ||
    s.y > k.y + k.height
  );
  kernel.webContents.send('kernel-settings-overlap', overlapping);
}

/**
 * Create the kernel settings window (single instance) [创建内核设置窗口 (单实例)]
 */
export function createKernelSettingsWindow(): void {
  if (kernelSettingsWindow && !kernelSettingsWindow.isDestroyed()) {
    if (kernelSettingsWindow.isMinimized()) kernelSettingsWindow.restore();
    kernelSettingsWindow.moveTop();
    kernelSettingsWindow.focus();
    return;
  }

  kernelSettingsWindow = new BrowserWindow({
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

  void kernelSettingsWindow.loadFile(KERNEL_SETTINGS_HTML);
  kernelSettingsWindow.once('ready-to-show', () => {
    kernelSettingsWindow?.show();
    syncKernelOverlap();
  });
  kernelSettingsWindow.on('move', syncKernelOverlap);
  kernelSettingsWindow.on('minimize', () => {
    const kernel = getKernelWindow();
    if (kernel && !kernel.isDestroyed()) kernel.webContents.send('kernel-settings-overlap', false);
  });
  kernelSettingsWindow.on('restore', syncKernelOverlap);
  kernelSettingsWindow.on('closed', () => {
    kernelSettingsWindow = null;
    const kernel = getKernelWindow();
    if (kernel && !kernel.isDestroyed()) kernel.webContents.send('kernel-settings-overlap', false);
  });
}
