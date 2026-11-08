// Settings window creation [设置窗口创建]
//
// Split out [已拆分]：window options/paths → settings-window-options.ts,
// lifecycle events → settings-window-events.ts.

import { BrowserWindow } from 'electron';
import { setSettingsWindow, getSettingsWindow } from 'sparklet/main/windows/window-manager.js';
import { buildSettingsWindowOptions, SETTINGS_HTML } from 'sparklet/main/windows/settings/settings-window-options.js';
import { bindSettingsWindowEvents } from 'sparklet/main/windows/settings/settings-window-events.js';

/**
 * Create the settings window (single instance) [创建设置窗口 (单实例)]
 */
export function createSettingsWindow(): void {
  const existing = getSettingsWindow();
  if (existing) {
    if (existing.isMinimized()) existing.restore();
    existing.moveTop();
    existing.focus();
    return;
  }
  const settingsWindow = new BrowserWindow(buildSettingsWindowOptions());
  setSettingsWindow(settingsWindow);

  settingsWindow.loadFile(SETTINGS_HTML);
  bindSettingsWindowEvents(settingsWindow);
}
