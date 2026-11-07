// Note history modal: restore action [笔记历史弹窗 - 恢复动作]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast.js';
import storageManager from 'sparklet/renderer/shared/storage/storage-manager.js';
import { noteApi } from 'sparklet/renderer/app/api/note-api.js';
import { refreshNoteListView } from '../../note/scripts/note-search.js';
import { getCurrentNoteId, loadNoteIntoEditor } from '../../editor/scripts/note-editor.js';
import type { Note } from 'sparklet/shared/types/notes.js';
import { hideNoteHistory } from './note-history-modal-view.js';

/**
 * Restore a snapshot and refresh the UI [恢复快照并刷新界面]
 */
export async function restoreSnapshot(noteId: string, ts: string): Promise<void> {
  const result = await noteApi.restoreSnapshot(noteId, ts);
  if (!result.success || !result.note) {
    console.error('恢复历史版本失败:', result.error);
    showToast(t('history.restoreFailed'), 'error');
    return;
  }

  // Refresh the renderer-side meta cache (restore bypassed storageManager) [刷新渲染侧元数据缓存 (恢复绕过了 storageManager)]
  await storageManager.refresh();
  await refreshNoteListView();

  // Reload the editor when the restored note is open [恢复的笔记正打开时重载编辑器]
  if (getCurrentNoteId() === noteId) {
    const fresh = await storageManager.getNoteById(noteId);
    if (fresh) await loadNoteIntoEditor(fresh as Note);
  }

  showToast(t('history.restoredToast'), 'success');
  hideNoteHistory();
}
