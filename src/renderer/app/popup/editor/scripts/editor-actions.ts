// Editor actions - barrel [编辑器操作 - 汇总出口]
// Load, switch, close, preview, startup [加载、切换、关闭、预览、启动]
//
// Split out [已拆分]：color indicator → editor-color-indicator.ts,
// load → editor-load.ts, switch → editor-switch.ts, close → editor-close.ts,
// preview → editor-preview.ts, startup → editor-startup.ts.

export { updateActiveColor } from 'sparklet/renderer/app/popup/editor/scripts/editor-color-indicator.js';
export { loadNoteIntoEditor } from 'sparklet/renderer/app/popup/editor/scripts/editor-load.js';
export { switchNote } from 'sparklet/renderer/app/popup/editor/scripts/editor-switch.js';
export { closeNote } from 'sparklet/renderer/app/popup/editor/scripts/editor-close.js';
export { togglePreview } from 'sparklet/renderer/app/popup/editor/scripts/editor-preview.js';
export { loadNotes } from 'sparklet/renderer/app/popup/editor/scripts/editor-startup.js';
