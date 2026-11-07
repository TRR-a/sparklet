// Editor actions - barrel [编辑器操作 - 汇总出口]
// Load, switch, close, preview, startup [加载、切换、关闭、预览、启动]
//
// Split out [已拆分]：color indicator → editor-color-indicator.ts,
// load → editor-load.ts, switch → editor-switch.ts, close → editor-close.ts,
// preview → editor-preview.ts, startup → editor-startup.ts.

export { updateActiveColor } from './editor-color-indicator.js';
export { loadNoteIntoEditor } from './editor-load.js';
export { switchNote } from './editor-switch.js';
export { closeNote } from './editor-close.js';
export { togglePreview } from './editor-preview.js';
export { loadNotes } from './editor-startup.js';
