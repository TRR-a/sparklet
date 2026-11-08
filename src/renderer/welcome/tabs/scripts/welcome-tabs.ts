// Welcome shell tab system [欢迎页外壳标签页系统]
//
// Split out [已拆分]：tab id/data store → welcome-tab-store.ts,
// activate → welcome-tab-activate.ts, create → welcome-tab-create.ts,
// close → welcome-tab-close.ts.

import { createTab } from 'sparklet/renderer/welcome/tabs/scripts/welcome-tab-create.js';
import { closeTab } from 'sparklet/renderer/welcome/tabs/scripts/welcome-tab-close.js';
import { activateTab } from 'sparklet/renderer/welcome/tabs/scripts/welcome-tab-activate.js';

export function initTabs(): void {
  const tabsEl = document.getElementById('shellTabs');
  if (!tabsEl) return;

  // Click tab to activate [点击标签页切换]
  tabsEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const closeBtn = target.closest('.shell-tab-close');
    if (closeBtn) {
      const tab = closeBtn.closest('.shell-tab') as HTMLElement;
      if (tab) closeTab(tab);
      return;
    }
    const tab = target.closest('.shell-tab') as HTMLElement;
    if (tab) activateTab(tab);
  });

  // New tab button [新建标签页按钮]
  const addBtn = document.getElementById('shellTabAdd');
  if (addBtn) addBtn.addEventListener('click', () => createTab({ title: 'New Tab' }));
}
