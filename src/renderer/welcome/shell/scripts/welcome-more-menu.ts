// Welcome "more" menu [欢迎页"更多"菜单]

import { windowApi } from 'sparklet/renderer/shared/index.js';

// ========== Init [初始化] ==========

export function bindWelcomeSettings(): void {
  const moreBtn = document.getElementById('shellMoreBtn');
  const moreMenu = document.getElementById('shellMoreMenu');
  moreBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (moreMenu) moreMenu.style.display = moreMenu.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('mousedown', (e) => {
    const target = e.target as Node;
    if (moreMenu && moreMenu.style.display === 'block' && !moreMenu.contains(target) && !moreBtn?.contains(target)) {
      moreMenu.style.display = 'none';
    }
  });
  document.querySelectorAll('.shell-more-item').forEach((item) => {
    item.addEventListener('click', () => {
      const action = (item as HTMLElement).dataset.action;
      if (moreMenu) moreMenu.style.display = 'none';
      if (action === 'settings') void windowApi.openWelcomeSettings();
    });
  });
}
