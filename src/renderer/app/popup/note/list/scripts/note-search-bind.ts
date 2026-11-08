// Note search: event binding [笔记搜索 - 事件绑定]

import { setSearchQuery, scheduleSearch, refreshNoteListView } from './note-search-run.js';
import { getSearchInput, updateClearButton, clearSearch } from './note-search-input.js';

/**
 * Bind search box events (call once on init) [绑定搜索框事件 (初始化时调用一次)]
 */
export function initNoteSearch(): void {
  const input = getSearchInput();
  if (!input) return;

  input.addEventListener('input', () => {
    setSearchQuery(input.value);
    updateClearButton();
    scheduleSearch();
  });

  // Esc in the input: blur only (double-Esc exit detection stays available) [输入框内按 Esc 仅失焦 (不干扰双击 Esc 退出检测)]
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      input.blur();
    }
  });

  const clearBtn = document.getElementById('noteSearchClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearSearch();
      void refreshNoteListView();
      input.focus();
    });
  }
}
