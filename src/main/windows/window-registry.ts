// Window registry: window references and accessors [窗口登记 - 窗口引用与读写]

import { BrowserWindow } from 'electron';

// Global window variables [全局窗口变量]
let welcomeWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let aboutWindow: BrowserWindow | null = null;

/** Welcome window — created at startup [Welcome 窗口 — 启动时创建] */
export function getWelcomeWindow(): BrowserWindow | null {
  return welcomeWindow;
}

export function setWelcomeWindow(win: BrowserWindow | null): void {
  welcomeWindow = win;
}

/** Official Main window [官方 Main 窗口] */
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
