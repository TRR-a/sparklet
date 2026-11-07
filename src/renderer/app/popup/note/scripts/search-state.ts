// Search state: query & debounce timer [搜索状态 - 关键词与防抖定时器]

/** Search debounce delay in ms [搜索防抖延迟 (毫秒)] */
export const SEARCH_DEBOUNCE_MS = 200;

/** Current query ('' = inactive) [当前关键词 (空 = 未激活)] */
let searchQuery = '';

/** Pending debounce timer [防抖定时器] */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Get the current query [获取当前关键词] */
export function getSearchQuery(): string {
  return searchQuery;
}

/** Set the current query [设置当前关键词] */
export function setSearchQuery(query: string): void {
  searchQuery = query;
}

/** Whether the search is currently active [搜索当前是否激活] */
export function isSearchActive(): boolean {
  return searchQuery.trim() !== '';
}

/** Get the pending timer [获取待触发的定时器] */
export function getDebounceTimer(): ReturnType<typeof setTimeout> | null {
  return debounceTimer;
}

/** Set the pending timer [设置待触发的定时器] */
export function setDebounceTimer(timer: ReturnType<typeof setTimeout> | null): void {
  debounceTimer = timer;
}

/** Reset query and cancel the debounce timer [重置关键词并取消防抖定时器] */
export function clearSearchState(): void {
  searchQuery = '';
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
