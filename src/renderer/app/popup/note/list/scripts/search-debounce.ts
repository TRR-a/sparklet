// Search: debounced trigger [搜索 - 防抖触发]

import { SEARCH_DEBOUNCE_MS, getSearchQuery, getDebounceTimer, setDebounceTimer } from 'sparklet/renderer/app/popup/note/list/scripts/search-state.js';
import { runSearch } from 'sparklet/renderer/app/popup/note/list/scripts/note-search-run.js';

/**
 * Debounced search trigger [防抖搜索触发]
 */
export function scheduleSearch(): void {
  const pending = getDebounceTimer();
  if (pending) clearTimeout(pending);
  setDebounceTimer(setTimeout(() => {
    setDebounceTimer(null);
    void runSearch(getSearchQuery());
  }, SEARCH_DEBOUNCE_MS));
}
