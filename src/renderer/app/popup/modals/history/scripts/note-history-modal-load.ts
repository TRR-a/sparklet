// Note history modal: load + prepare [笔记历史弹窗 - 加载与准备]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { noteApi } from 'sparklet/renderer/app/api/note-api.js';
import type { NoteHistoryResult } from 'sparklet/shared/types/note/notes.js';
import type { SnapshotSelectState } from 'sparklet/renderer/app/popup/modals/history/scripts/note-history-modal-select.js';

/** Everything the modal needs before rendering [弹窗渲染前所需的全部上下文] */
export interface HistoryViewContext {
  entries: NonNullable<NoteHistoryResult['entries']>;
  state: SnapshotSelectState;
  detailEl: HTMLElement;
  restoreBtn: HTMLElement | null;
}

/**
 * Fetch history entries and current content; null when loading fails [拉取历史条目与当前正文；加载失败返回 null]
 */
export async function prepareHistoryView(
  noteId: string,
  detailEl: HTMLElement,
  restoreBtn: HTMLElement | null
): Promise<HistoryViewContext | null> {
  const result = await noteApi.history(noteId);
  if (!result.success || !result.entries) {
    console.error('加载历史记录失败:', result.error);
    showToast(t('history.loadFailed'), 'error');
    return null;
  }

  const current = await storageManager.getNoteById(noteId);
  const state: SnapshotSelectState = { currentContent: current ? current.content : '' };
  return { entries: result.entries, state, detailEl, restoreBtn };
}
