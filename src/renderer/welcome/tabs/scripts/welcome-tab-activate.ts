// Welcome tabs: activate [欢迎页标签 - 激活]

/**
 * Mark one tab active and all siblings inactive [把某个标签设为激活，其余设为非激活]
 */
export function activateTab(tab: HTMLElement): void {
  document.querySelectorAll('.shell-tab').forEach(t => {
    t.classList.remove('active');
    if (t !== tab) t.classList.add('inactive');
  });
  tab.classList.remove('inactive');
  tab.classList.add('active');
}
