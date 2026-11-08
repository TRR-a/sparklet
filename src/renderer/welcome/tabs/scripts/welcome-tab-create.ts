// Welcome tabs: create [欢迎页标签 - 新建]

import { nextTabId, putTabData, type TabData } from 'sparklet/renderer/welcome/tabs/scripts/welcome-tab-store.js';
import { activateTab } from 'sparklet/renderer/welcome/tabs/scripts/welcome-tab-activate.js';

/**
 * Create a tab element and activate it [创建标签元素并激活]
 */
export function createTab(opts: TabData): HTMLElement {
  const tabsEl = document.getElementById('shellTabs');
  if (!tabsEl) return document.createElement('div');
  const addBtn = document.getElementById('shellTabAdd');
  const id = nextTabId();

  const tab = document.createElement('div');
  tab.className = 'shell-tab';
  tab.dataset.tabId = String(id);
  tab.innerHTML = `<span class="shell-tab-title">${opts.title}</span><button class="shell-tab-close" aria-label="Close tab">×</button>`;

  putTabData(id, opts);
  tabsEl.insertBefore(tab, addBtn);
  activateTab(tab);
  return tab;
}
