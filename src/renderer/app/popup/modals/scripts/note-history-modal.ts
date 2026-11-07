// Note history modal - version snapshot list + diff preview + restore [笔记历史弹窗 - 版本快照列表 + 差异预览 + 恢复]
//
// Behavior [行为]：
//   - Opened from the note card menu "历史记录" [经笔记卡片菜单"历史记录"打开]
//   - Left: snapshot list (time / title / char count), newest first [左侧快照列表 (时间/标题/字数)，时间降序]
//   - Click a snapshot → line diff vs the current note content (custom LCS, no libs)
//     [点击快照 → 与当前正文的行级差异 (自研 LCS，无第三方库)]
//   - "恢复此版本" → main process snapshots current state first, then restores
//     [恢复前主进程先快照当前状态，再写入所选版本]
//
// Diff computation in history-diff.ts [差异计算在 history-diff.ts]
// Split out [已拆分]：view → note-history-modal-view.ts,
// restore → note-history-restore.ts, startup toast → note-history-startup-toast.ts,
// snapshot selection + diff → note-history-modal-select.ts,
// load/prepare → note-history-modal-load.ts.

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { getHistoryModal, renderHistoryList } from './note-history-modal-view.js';
import { selectSnapshot } from './note-history-modal-select.js';
import { prepareHistoryView } from './note-history-modal-load.js';

export {
  hideNoteHistory,
  bindNoteHistoryModalHandlers,
} from './note-history-modal-view.js';
export { showNoteHistoryStartupToast } from './note-history-startup-toast.js';

/**
 * Show note history modal [显示笔记历史弹窗]
 */
export async function showNoteHistory(noteId: string): Promise<void> {
  const modal = getHistoryModal();
  const detailEl = document.getElementById('noteHistoryDetail');
  const restoreBtn = document.getElementById('noteHistoryRestoreBtn');
  if (!modal || !detailEl) return;

  const ctx = await prepareHistoryView(noteId, detailEl, restoreBtn);
  if (!ctx) return;

  if (ctx.restoreBtn) ctx.restoreBtn.style.display = 'none';
  ctx.detailEl.innerHTML = `<div class="history-empty">${t('history.hint')}</div>`;

  renderHistoryList(ctx.entries, null, id => {
    void selectSnapshot(noteId, id, ctx.entries, ctx.detailEl, ctx.restoreBtn, ctx.state);
  });
  modal.style.display = 'flex';
  // Auto-select the newest snapshot [自动选中最新快照]
  if (ctx.entries.length > 0) {
    await selectSnapshot(noteId, ctx.entries[0].ts, ctx.entries, ctx.detailEl, ctx.restoreBtn, ctx.state);
  }
}
