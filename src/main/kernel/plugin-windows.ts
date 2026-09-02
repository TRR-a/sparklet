// Plugin window manager: create/focus plugin main windows [插件窗口管理器：创建/聚焦插件主窗口]
// The kernel opens a plugin's main page (manifest.main) in its own window.
// The window is tracked per plugin id so opening it twice focuses the same
// instance. The global "main window" slot is reused for the currently active
// plugin main window — the note plugin relies on it for settings glow sync.
// [内核将插件主页面 (manifest.main) 加载到独立窗口。窗口按插件 id 跟踪，
// 重复打开时聚焦同一实例。全局 "主窗口" 槽位复用给当前激活的插件主窗口——
// note 插件依赖它做设置窗口光晕同步]

import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { setMainWindow, getSettingsWindow, syncGlowPosition } from '../windows/window-manager';
import { getCurrentVersion } from '../updater/check';
import * as cacheManager from '../updater/cache-manager';
import { CACHE_SUCCESS_MARK_DELAY_MS } from '../updater/constants';
import { getPluginRoot } from './plugin-manager';
import type { PluginDescriptor } from '../../shared/types/plugins';

// Preload script path (relative to build/src/main/kernel) [Preload 脚本路径]
const PRELOAD_PATH = path.join(__dirname, '../../preload/index.js');

// Icon path (app-level icon) [应用级图标路径]
const ICON_PATH = path.join(__dirname, '../../../assets/icons/icon128.png');

// Open plugin windows, keyed by plugin id [已打开的插件窗口，按插件 id 索引]
const pluginWindows = new Map<string, BrowserWindow>();

/**
 * Open (or focus) a plugin's main window [打开 (或聚焦) 插件主窗口]
 */
export function openPluginWindow(plugin: PluginDescriptor): void {
  const existing = pluginWindows.get(plugin.id);
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore();
    existing.focus();
    return;
  }

  const root = getPluginRoot(plugin.id);
  if (!root) return;

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
  pluginWindows.set(plugin.id, win);
  // Single-instance: the currently active plugin main window also occupies the
  // global main window slot (the note plugin depends on it for glow sync).
  // [单实例：当前激活的插件主窗口同时占用全局主窗口槽位 (note 插件依赖它做光晕同步)]
  setMainWindow(win);

  win.loadFile(path.join(root, plugin.main));
  win.once('ready-to-show', () => {
    win.show();
    // Mark first launch for the updater's cache success window [为更新器缓存成功窗口标记首次启动]
    setTimeout(async () => {
      try {
        if (win.isDestroyed()) return;
        if (app.isPackaged) {
          const currentVersion = getCurrentVersion();
          await cacheManager.markSuccessFirstLaunch(`v${currentVersion}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[PluginWindow] markSuccessFirstLaunch failed (non-critical):', msg);
      }
    }, CACHE_SUCCESS_MARK_DELAY_MS);
  });
  // Keep settings window on top while the plugin main window is focused [插件主窗口聚焦时保持设置窗口置顶]
  win.on('focus', () => {
    const settingsWindow = getSettingsWindow();
    if (settingsWindow && !settingsWindow.isDestroyed() && !settingsWindow.isMinimized()) {
      settingsWindow.moveTop();
    }
  });
  win.on('move', syncGlowPosition);
  win.on('resize', syncGlowPosition);
  win.on('closed', () => {
    pluginWindows.delete(plugin.id);
    setMainWindow(null);
  });
}

/**
 * Whether a plugin's main window is currently open [插件主窗口当前是否已打开]
 */
export function isPluginWindowOpen(id: string): boolean {
  const win = pluginWindows.get(id);
  return win !== null && win !== undefined && !win.isDestroyed();
}
