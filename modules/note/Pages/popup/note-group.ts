// Note group helpers - collapsible group titles and empty placeholders [笔记分组 - 可折叠分组标题与空占位]
// Collapse state is data-level: the virtual list model rebuilds without the group's cards,
// so toggling only flips the flag and calls onRebuild [折叠是数据级状态：虚拟列表模型重建时跳过该组卡片，
// 切换只翻转标记并回调重建]

import { t } from '../../Modules/i18n.js';

/** Collapsed group keys, kept across re-renders [折叠的分组键，重渲染后保持] */
export const collapsedGroups = new Set<string>();

/**
 * Create a collapsible group title [创建可折叠分组标题]
 * @param key Group identity for collapse state [分组折叠状态键]
 * @param label Group label text [分组标题文本]
 * @param onRebuild Rebuild callback after collapse state changes [折叠状态变化后的重建回调]
 * @returns Group title list element [分组标题 li 元素]
 */
export function createGroupTitle(key: string, label: string, onRebuild?: () => void): HTMLElement {
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
    onRebuild?.();
  });

  return title;
}

/**
 * Create an empty-group placeholder [创建空分组占位项]
 * @param label Custom hint text (defaults to noteList.empty) [自定义提示文本 (默认 noteList.empty)]
 * @returns Empty hint list element [-无- 提示 li 元素]
 */
export function createGroupEmpty(label?: string): HTMLElement {
  const empty = document.createElement('li');
  empty.className = 'note-group-empty';
  empty.textContent = label || t('noteList.empty');
  return empty;
}
