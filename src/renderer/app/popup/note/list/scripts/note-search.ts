// Note search - search box UI binding - barrel [笔记搜索 - 搜索框 UI 绑定 - 汇总出口]
//
// Behavior [行为]：
//   - Typing runs a debounced main-process search (notes:search, case-insensitive) [输入防抖后触发主进程搜索 (忽略大小写)]
//   - Results render as a flat virtual list: one header "N matches" + cards [结果以扁平虚拟列表渲染：一个计数头 + 卡片]
//   - Clearing the query restores the normal grouped list [清空关键词后恢复常规分组列表]
//   - refreshNoteListView() is the single re-render entry for note operations (save/delete/pin/...)
//     so an active search stays active while editing [笔记操作统一经 refreshNoteListView 重渲染，
//     搜索激活时编辑笔记不会丢失搜索结果视图]
//
// Query execution & rendering in note-search-run.ts [查询执行与渲染在 note-search-run.ts]
// Input helpers in note-search-input.ts, event binding in note-search-bind.ts
// [输入框辅助在 note-search-input.ts，事件绑定在 note-search-bind.ts]

export { isSearchActive, refreshNoteListView } from './note-search-run.js';
export { clearSearch, focusSearchInput } from './note-search-input.js';
export { initNoteSearch } from './note-search-bind.js';
