// Note history modal: dialog view - barrel [笔记历史弹窗 - 视图 - 汇总出口]
//
// Split out [已拆分]：list rendering → note-history-list-render.ts,
// show/hide/close binding → note-history-modal-close.ts.

export { getHistoryModal, renderHistoryList } from './note-history-list-render.js';
export { hideNoteHistory, bindNoteHistoryModalHandlers } from './note-history-modal-close.js';
