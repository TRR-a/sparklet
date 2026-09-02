// Window manager: holds references to all app windows and provides sync helpers [窗口管理器：持有所有应用窗口的引用并提供同步辅助函数]
// Microkernel layout: the kernel (Hub) window is created at startup; the
// "main window" slot tracks the currently active plugin main window (used by
// the note plugin for settings glow sync).
// [微内核布局：启动时创建内核 (Hub) 窗口；"主窗口" 槽位跟踪当前激活的插件
// 主窗口 (note 插件用它做设置窗口光晕同步)]

import { BrowserWindow } from 'electron';

// Global window variables [全局窗口变量]
let kernelWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let aboutWindow: BrowserWindow | null = null;

/** Main window bounds for glow sync [主窗口边界 (光晕同步用)] */
export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Glow position sync data [光晕位置同步数据] */
export interface GlowSyncData {
  mainBounds: WindowBounds;
  settingsBounds: WindowBounds;
}

// ========== Getters and setters ==========

/** Kernel (Hub) window — created at startup [内核 (Hub) 窗口 — 启动时创建] */
export function getKernelWindow(): BrowserWindow | null {
  return kernelWindow;
}

export function setKernelWindow(win: BrowserWindow | null): void {
  kernelWindow = win;
}

/** Currently active plugin main window (note popup) [当前激活的插件主窗口 (note 弹窗)] */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win;
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}

export function setSettingsWindow(win: BrowserWindow | null): void {
  settingsWindow = win;
}

export function getAboutWindow(): BrowserWindow | null {
  return aboutWindow;
}

export function setAboutWindow(win: BrowserWindow | null): void {
  aboutWindow = win;
}

/**
 * Sync glow position between main window and settings window [同步主窗口和设置窗口之间的光晕位置]
 */
export function syncGlowPosition(): void {
  if (
    mainWindow && !mainWindow.isDestroyed() &&
    settingsWindow && !settingsWindow.isDestroyed()
  ) {
    const mainBounds = mainWindow.getBounds();
    const settingsBounds = settingsWindow.getBounds();
    mainWindow.webContents.send('settings-window-moved', { mainBounds, settingsBounds });
    const isOverlapping = !(
      settingsBounds.x + settingsBounds.width < mainBounds.x ||
      settingsBounds.x > mainBounds.x + mainBounds.width ||
      settingsBounds.y + settingsBounds.height < mainBounds.y ||
      settingsBounds.y > mainBounds.y + mainBounds.height
    );
    mainWindow.webContents.send('settings-window-overlap', isOverlapping);
  }
}
