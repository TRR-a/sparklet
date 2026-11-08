// Welcome tabs: close [欢迎页标签 - 关闭]

import { windowApi } from '../../../shared/index.js';
import { dropTabData } from './welcome-tab-store.js';
import { activateTab } from './welcome-tab-activate.js';

/**
 * Close a tab; closing the last tab quits the app [关闭标签；关闭最后一个时退出应用]
 */
export function closeTab(tab: HTMLElement): void {
  const tabs = document.querySelectorAll('.shell-tab');
  if (tabs.length <= 1) {
    // Last tab closed -> quit the app [最后一个标签页关闭 -> 退出应用]
    void windowApi.quitApp();
    return;
  }
  const wasActive = tab.classList.contains('active');
  const id = parseInt(tab.dataset.tabId || '0', 10);
  dropTabData(id);
  const next = tab.nextElementSibling as HTMLElement | null;
  const prev = tab.previousElementSibling as HTMLElement | null;
  tab.remove();
  if (wasActive) {
    activateTab((next?.classList.contains('shell-tab') ? next : prev) as HTMLElement);
  }
}
