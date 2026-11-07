// Search: debounced trigger [搜索 - 防抖触发]

import { SEARCH_DEBOUNCE_MS, getSearchQuery, getDebounceTimer, setDebounceTimer } from './search-state.js';
import { runSearch } from './note-search-run.js';

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
