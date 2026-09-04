// Note group helpers - collapsible group titles and empty placeholders [笔记分组 - 可折叠分组标题与空占位]

import { t } from '../../Modules/i18n.js';

/** Collapsed group keys, kept across re-renders [折叠的分组键，重渲染后保持] */
export const collapsedGroups = new Set<string>();

/**
 * Create a collapsible group title [创建可折叠的分组标题]
 * @param key Group identity for collapse state [分组折叠状态键]
 * @param label Group label text [分组标题文本]
 * @returns Group title list element [分组标题 li 元素]
 */
export function createGroupTitle(key: string, label: string): HTMLElement {
  const title = document.createElement('li');
  title.className = 'note-group-title';
  const isCollapsed = collapsedGroups.has(key);
  if (isCollapsed) title.classList.add('collapsed');
  title.innerHTML =
    `<span class="group-caret">${isCollapsed ? '▶' : '▼'}</span>` +
    `<span class="group-label">${label}</span>`;

  title.addEventListener('click', () => {
    const collapsed = title.classList.toggle('collapsed');
    const caret = title.querySelector('.group-caret');
    if (caret) caret.textContent = collapsed ? '▶' : '▼';
    if (collapsed) collapsedGroups.add(key);
    else collapsedGroups.delete(key);

    // Toggle every following sibling until the next group title [切换到下一个分组标题前的所有兄弟元素]
    let next = title.nextElementSibling;
    while (next && !next.classList.contains('note-group-title')) {
      (next as HTMLElement).style.display = collapsed ? 'none' : '';
      next = next.nextElementSibling;
    }
  });

  return title;
}

/**
 * Create an empty-group placeholder [创建空分组占位项]
 * @returns Empty hint list element [-无- 提示 li 元素]
 */
export function createGroupEmpty(): HTMLElement {
  const empty = document.createElement('li');
  empty.className = 'note-group-empty';
  empty.textContent = t('noteList.empty');
  return empty;
}

/**
 * Apply a group key + initial collapse state to a card element [为卡片元素设置分组键与初始折叠状态]
 * @param card Card element [卡片元素]
 * @param key Group key [分组键]
 */
export function applyGroup(card: HTMLElement, key: string): HTMLElement {
  card.dataset.group = key;
  if (collapsedGroups.has(key)) card.style.display = 'none';
  return card;
}
