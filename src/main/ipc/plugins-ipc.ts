// Plugin IPC handlers: list detected plugins and open them [插件 IPC 处理器：列出已检测插件并打开]
// The kernel UI discovers what is installed via plugins:list and opens a
// plugin's main window via plugins:open. With zero plugins the list is empty
// and the kernel shows its empty state — the app still boots.
// [内核 UI 经 plugins:list 发现已安装插件，经 plugins:open 打开插件主窗口。
// 零插件时列表为空，内核展示空状态——应用仍正常启动]

import { ipcMain } from 'electron';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { getPlugins, findPlugin, getPluginRoot } from '../kernel/plugin-manager';
import { openPluginWindow, isPluginWindowOpen } from '../kernel/plugin-windows';

/**
 * Register plugin discovery/open IPC handlers [注册插件发现/打开 IPC 处理器]
 */
export function registerPluginIpcHandlers(): void {
  // ========== Plugin discovery [插件发现] ==========
  ipcMain.handle('plugins:list', () => getPlugins());

  // ========== Plugin file URL for embedded webview [插件文件 URL（用于内嵌 webview）] ==========
  ipcMain.handle('plugins:get-url', (_event, id: unknown) => {
    if (typeof id !== 'string') return null;
    const plugin = findPlugin(id);
    const root = getPluginRoot(id);
    if (!plugin || !root) return null;
    return path.join(root, plugin.main);
  });

  // ========== Preload URL for embedded webview [webview 的 preload URL] ==========
  ipcMain.handle('plugins:get-preload-url', () => {
    const preloadPath = path.join(__dirname, '../../preload/index.js');
    return pathToFileURL(preloadPath).href;
  });

  // ========== Open plugin main window [打开插件主窗口] ==========
  ipcMain.handle('plugins:open', (_event, id: unknown) => {
    if (typeof id !== 'string') return;
    const plugin = findPlugin(id);
    if (plugin) openPluginWindow(plugin);
  });

  // ========== Plugin window state [插件窗口状态] ==========
  ipcMain.handle('plugins:is-open', (_event, id: unknown) => {
    if (typeof id !== 'string') return false;
    return isPluginWindowOpen(id);
  });
}
