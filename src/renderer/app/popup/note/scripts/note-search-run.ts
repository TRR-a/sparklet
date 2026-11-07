// Note search query execution & list refresh [笔记搜索查询执行与列表刷新]
//
// Split out [已拆分]：state → search-state.ts, result rendering → search-results.ts,
// debounce trigger → search-debounce.ts.

import storageManager from 'sparklet/renderer/shared/storage/storage-manager.js';
import { noteApi } from 'sparklet/renderer/app/api/note-api.js';
import { renderNoteList } from './note-list.js';
import { getActiveNoteId } from './note-virtual-list.js';
import { getSearchQuery, isSearchActive } from './search-state.js';
import { renderSearchResults } from './search-results.js';

/** Re-export the search state surface [再导出搜索状态接口] */
export { SEARCH_DEBOUNCE_MS, getSearchQuery, setSearchQuery, isSearchActive, clearSearchState } from './search-state.js';
export { scheduleSearch } from './search-debounce.js';

/**
 * Run the search and render results [执行搜索并渲染结果]
 */
export async function runSearch(query: string): Promise<void> {
  // Empty query = search inactive: restore the normal grouped list instead of showing "0 results" [空关键词 = 搜索未激活：恢复常规分组列表，而非显示"0 个结果"]
  if (!query.trim()) {
    const allNotes = await storageManager.getNotes();
    await renderNoteList(allNotes, getActiveNoteId());
    return;
  }
  const result = await noteApi.search(query);
  // Stale guard: if the query changed (or was cleared) while we awaited, drop this result [过期保护：await 期间 query 已变或已清除则丢弃结果]
  if (getSearchQuery() !== query) return;
  if (!result.success || !result.notes) {
    console.error('搜索笔记失败:', result.error);
    return;
  }

  renderSearchResults(result.notes);
}

/**
 * Unified list re-render entry for note operations [笔记操作统一的列表重渲染入口]
 * Keeps the search view when active, otherwise renders the normal grouped list [搜索激活时保持搜索结果视图，否则渲染常规分组列表]
 */
export async function refreshNoteListView(): Promise<void> {
  if (isSearchActive()) {
    await runSearch(getSearchQuery());
    return;
  }
  const notes = await storageManager.getNotes();
  await renderNoteList(notes, getActiveNoteId());
}
