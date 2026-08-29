// Theme management - load, set, and toggle app theme [主题管理 - 加载、设置和切换应用主题]

import { storeApi, broadcastApi } from '../../../src/renderer/core/index.js';

/**
 * Set the current theme on the body element [在 body 元素上设置当前主题]
 */
export function setTheme(theme: string): void {
  document.body.dataset.theme = theme;
}

/**
 * Load theme from store and apply it [从存储加载主题并应用]
 */
export async function loadTheme(): Promise<string> {
  const theme = await storeApi.get<string>('theme');
  const appliedTheme = theme || 'light';
  document.body.dataset.theme = appliedTheme;
  return appliedTheme;
}

/**
 * Toggle between dark and light themes, persist and broadcast [在深色和浅色主题间切换，持久化并广播]
 */
export async function toggleTheme(): Promise<void> {
  const currentTheme = document.body.dataset.theme;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  await storeApi.set('theme', newTheme);
  await broadcastApi.notifyThemeChanged(newTheme);
}

/**
 * Bind theme broadcast listener (receives theme changes from other windows) [绑定主题广播监听 (接收其他窗口的主题变更)]
 */
export function bindThemeBroadcastListener(): void {
  broadcastApi.onThemeBroadcast((theme: unknown) => {
    document.body.dataset.theme = theme as string;
  });
}
