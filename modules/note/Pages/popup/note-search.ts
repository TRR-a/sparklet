// Note search - full-text search box over note title + content [笔记搜索 - 标题+正文全文搜索框]
//
// Behavior [行为]：
//   - Typing runs a debounced main-process search (notes:search, case-insensitive) [输入防抖后触发主进程搜索 (忽略大小写)]
//   - Results render as a flat virtual list: one header "N matches" + cards [结果以扁平虚拟列表渲染：一个计数头 + 卡片]
//   - Clearing the query restores the normal grouped list [清空关键词后恢复常规分组列表]
//   - refreshNoteListView() is the single re-render entry for note operations (save/delete/pin/...)
//     so an active search stays active while editing [笔记操作统一经 refreshNoteListView 重渲染，
//     搜索激活时编辑笔记不会丢失搜索结果视图]

import { t } from '../../Modules/i18n.js';
import storageManager from '../../Modules/storage-manager.js';
import { noteApi } from '../../api/note-api.js';
import { renderNoteList } from './note-list.js';
import { createNoteCard } from './note-card.js';
import { renderVirtualNoteList, getActiveNoteId, type VirtualItem } from './note-virtual-list.js';

/** Search debounce delay in ms [搜索防抖延迟 (毫秒)] */
const SEARCH_DEBOUNCE_MS = 200;

/** Current query ('' = inactive) [当前关键词 (空 = 未激活)] */
let searchQuery = '';

/** Pending debounce timer [防抖定时器] */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Get the search input element [获取搜索输入框元素]
 */
function getInput(): HTMLInputElement | null {
  return document.getElementById('noteSearchInput') as HTMLInputElement | null;
}

/**
 * Update the clear-button visibility [更新清空按钮可见性]
 */
function updateClearButton(): void {
  const clearBtn = document.getElementById('noteSearchClear');
  if (clearBtn) clearBtn.style.display = searchQuery ? 'flex' : 'none';
}

/**
 * Whether the search is currently active [搜索当前是否激活]
 */
export function isSearchActive(): boolean {
  return searchQuery.trim() !== '';
}

/**
 * Clear the search query and input (list NOT re-rendered - caller decides) [清空关键词与输入框 (不重渲染列表 - 由调用方决定)]
 */
export function clearSearch(): void {
  searchQuery = '';
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  const input = getInput();
  if (input) input.value = '';
  updateClearButton();
}

/**
 * Focus and select the search input [聚焦并全选搜索输入框]
 */
export function focusSearchInput(): void {
  const input = getInput();
  if (input) {
    input.focus();
    input.select();
  }
}

/**
 * Run the search and render results [执行搜索并渲染结果]
 */
async function runSearch(query: string): Promise<void> {
  const result = await noteApi.search(query);
  if (!result.success || !result.notes) {
    console.error('搜索笔记失败:', result.error);
    return;
  }

  const items: VirtualItem[] = [];
  items.push({ kind: 'title', key: 'search-results', label: t('search.resultTitle', { n: String(result.notes.length) }) });
  if (result.notes.length === 0) {
    items.push({ kind: 'empty', label: t('search.noResult') });
  } else {
    result.notes.forEach(note => items.push({ kind: 'card', note, variant: 'main' }));
  }

  renderVirtualNoteList(items, {
    // Search header is informational only (not collapsible) [搜索结果头仅展示信息 (不可折叠)]
    createTitle: item => {
      const li = document.createElement('li');
      li.className = 'note-group-title';
      li.innerHTML = `<span class="group-label">${item.label}</span>`;
      return li;
    },
    createEmpty: item => {
      const li = document.createElement('li');
      li.className = 'note-group-empty';
      li.textContent = item.label || t('noteList.empty');
      return li;
    },
    createCard: (item, activeNoteId) => createNoteCard(item.note, activeNoteId),
  }, { activeNoteId: getActiveNoteId() });
}

/**
 * Debounced search trigger [防抖搜索触发]
 */
function scheduleSearch(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runSearch(searchQuery);
  }, SEARCH_DEBOUNCE_MS);
}

/**
 * Unified list re-render entry for note operations [笔记操作统一的列表重渲染入口]
 * Keeps the search view when active, otherwise renders the normal grouped list [搜索激活时保持搜索结果视图，否则渲染常规分组列表]
 */
export async function refreshNoteListView(): Promise<void> {
  if (isSearchActive()) {
    await runSearch(searchQuery);
    return;
  }
  const notes = await storageManager.getNotes();
  await renderNoteList(notes, getActiveNoteId());
}

/**
 * Bind search box events (call once on init) [绑定搜索框事件 (初始化时调用一次)]
 */
export function initNoteSearch(): void {
  const input = getInput();
  if (!input) return;

  input.addEventListener('input', () => {
    searchQuery = input.value;
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
