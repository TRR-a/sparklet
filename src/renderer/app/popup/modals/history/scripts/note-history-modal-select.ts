// Note history modal: snapshot selection + diff preview [笔记历史弹窗 - 快照选择与差异预览]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { noteApi } from 'sparklet/renderer/app/api/note-api.js';
import type { NoteHistoryEntry } from 'sparklet/shared/types/note/notes.js';
import { renderHistoryList } from 'sparklet/renderer/app/popup/modals/history/scripts/note-history-modal-view.js';
import { restoreSnapshot } from 'sparklet/renderer/app/popup/modals/history/scripts/note-history-restore.js';
import { renderDetail } from 'sparklet/renderer/app/popup/modals/history/scripts/history-diff.js';

/** Selection state carried across selects [跨多次选择保留的状态] */
export interface SnapshotSelectState {
  currentContent: string;
}

/**
 * Select a snapshot: re-render the list, load the snapshot, render the line diff
 * and arm the restore button [选中快照：重渲染列表、加载快照、渲染行级差异并挂上恢复按钮]
 */
export async function selectSnapshot(
  noteId: string,
  ts: string,
  entries: NoteHistoryEntry[],
  detailEl: HTMLElement,
  restoreBtn: HTMLElement | null,
  state: SnapshotSelectState
): Promise<void> {
  const select = async (nextTs: string): Promise<void> => {
    await selectSnapshot(noteId, nextTs, entries, detailEl, restoreBtn, state);
  };

  renderHistoryList(entries, ts, id => { void select(id); });

  const snap = await noteApi.getSnapshot(noteId, ts);
  if (!snap.success || !snap.snapshot) {
    detailEl.innerHTML = `<div class="history-empty">${t('history.loadFailed')}</div>`;
    return;
  }
  // Re-read current content so the diff targets the latest saved state
  // [重新读取当前正文，保证差异对比的是最新已保存内容]
  const fresh = await storageManager.getNoteById(noteId);
  if (fresh) state.currentContent = fresh.content;

  const header = document.createElement('div');
  header.className = 'history-diff-title';
  header.textContent = t('history.diffTitle');
  const body = document.createElement('div');
  body.className = 'history-diff';
  renderDetail(body, snap.snapshot.note.content, state.currentContent);
  detailEl.innerHTML = '';
  detailEl.append(header, body);

  if (restoreBtn) {
    restoreBtn.style.display = '';
    restoreBtn.onclick = () => { void restoreSnapshot(noteId, ts); };
  }
}
