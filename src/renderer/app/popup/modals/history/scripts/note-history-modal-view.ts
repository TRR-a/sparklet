// Note history modal: dialog view - barrel [笔记历史弹窗 - 视图 - 汇总出口]
//
// Split out [已拆分]：list rendering → note-history-list-render.ts,
// show/hide/close binding → note-history-modal-close.ts.

export { getHistoryModal, renderHistoryList } from 'sparklet/renderer/app/popup/modals/history/scripts/note-history-list-render.js';
export { hideNoteHistory, bindNoteHistoryModalHandlers } from 'sparklet/renderer/app/popup/modals/history/scripts/note-history-modal-close.js';
