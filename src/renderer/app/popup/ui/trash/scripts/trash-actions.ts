// Trash actions: preview, restore, permanent delete [回收站操作 - 预览、恢复、永久删除]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showCustomConfirm } from 'sparklet/renderer/shared/ui/dialog/custom-dialog.js';
import { renderMarkdown } from 'sparklet/renderer/shared/markdown/markdown.js';
import { escapeHtml } from 'sparklet/renderer/shared/ui/dom/dom-utils.js';

/**
 * Show trash note preview in editor area [在编辑区显示回收站笔记预览]
 */
export async function showTrashPreview(noteId: string): Promise<void> {
  const note = await storageManager.getNoteById(noteId);
  if (!note) return;
  const notePreview = document.getElementById('notePreview');
  if (notePreview) {
    const titleHtml = escapeHtml(note.title || t('main.noteUntitled'));
    const contentHtml = renderMarkdown(note.content || '');
    notePreview.innerHTML = `<h2 class="trash-preview-title">${titleHtml}</h2><div class="trash-preview-content">${contentHtml}</div>`;
  }
}

/**
 * Restore note from trash [从回收站恢复笔记]
 */
export async function restoreFromTrash(noteId: string): Promise<void> {
  const success = await storageManager.restoreNote(noteId);
  if (success) {
    const { renderTrashList } = await import('sparklet/renderer/app/popup/ui/trash/scripts/trash-view.js');
    await renderTrashList();
  }
}

/**
 * Permanently delete note (with confirmation) [永久删除笔记 (带确认)]
 */
export async function permanentlyDeleteNote(noteId: string): Promise<void> {
  const confirmed = await showCustomConfirm({
    title: t('confirm.default.title'),
    message: t('main.confirmPermanentDelete'),
    okText: t('main.btnPermanentDelete'),
    cancelText: t('confirm.default.cancel'),
    okDanger: true
  });
  if (!confirmed) return;
  const success = await storageManager.permanentlyDeleteNote(noteId);
  if (success) {
    const { renderTrashList } = await import('sparklet/renderer/app/popup/ui/trash/scripts/trash-view.js');
    await renderTrashList();
  }
}
