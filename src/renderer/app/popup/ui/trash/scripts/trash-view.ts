// Trash view - barrel [回收站视图 - 汇总出口]
// View toggle, main view restore, list rendering [视图切换、主视图恢复、列表渲染]
// Card in trash-card.ts, per-note actions in trash-actions.ts [卡片在 trash-card.ts，单条操作在 trash-actions.ts]
//
// Split out [已拆分]：state → trash-view-state.ts, toggle → trash-view-toggle.ts,
// main restore → trash-view-main.ts, list → trash-view-list.ts,
// Esc handler → trash-view-escape.ts.

export { getCurrentView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-state.js';
export { toggleTrashView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-toggle.js';
export { renderTrashList } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-list.js';

// Import for side effect: registers the Esc handler [导入以注册 Esc 监听]
import 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-escape.js';
