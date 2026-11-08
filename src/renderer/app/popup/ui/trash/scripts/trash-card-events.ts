// Trash card: event bindings [回收站卡片 - 事件绑定]
//
// Split out [已拆分]：click → trash-card-click.ts,
// restore/delete buttons → trash-card-buttons.ts,
// more menu → trash-card-menu.ts.

import { bindTrashCardClick } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-card-click.js';
import { bindTrashCardButtons } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-card-buttons.js';
import { bindTrashCardMenu } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-card-menu.js';
import type { NoteListItem } from 'sparklet/renderer/app/popup/note/list/scripts/note-list.js';

/** Wire click / restore / delete / menu handlers onto a trash card [给回收站卡片接线点击/恢复/删除/菜单处理] */
export function bindTrashCardEvents(li: HTMLElement, note: NoteListItem): void {
  bindTrashCardClick(li, note);
  bindTrashCardButtons(li, note);
  bindTrashCardMenu(li, note);
}
