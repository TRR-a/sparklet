// Note search: input element helpers [笔记搜索 - 输入框辅助]

import { getSearchQuery, clearSearchState } from 'sparklet/renderer/app/popup/note/list/scripts/note-search-run.js';

/** Get the search input element [获取搜索输入框元素] */
export function getSearchInput(): HTMLInputElement | null {
  return document.getElementById('noteSearchInput') as HTMLInputElement | null;
}

/** Update the clear-button visibility [更新清空按钮可见性] */
export function updateClearButton(): void {
  const clearBtn = document.getElementById('noteSearchClear');
  if (clearBtn) clearBtn.style.display = getSearchQuery() ? 'flex' : 'none';
}

/**
 * Clear the search query and input (list NOT re-rendered - caller decides) [清空关键词与输入框 (不重渲染列表 - 由调用方决定)]
 */
export function clearSearch(): void {
  clearSearchState();
  const input = getSearchInput();
  if (input) input.value = '';
  updateClearButton();
}

/**
 * Focus and select the search input [聚焦并全选搜索输入框]
 */
export function focusSearchInput(): void {
  const input = getSearchInput();
  if (input) {
    input.focus();
    input.select();
  }
}
