// Note action: edit tags via prompt [笔记操作 - 通过弹窗编辑标签]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { refreshNoteListView } from '../list/scripts/note-search.js';

/**
 * Edit note tags via a prompt (comma-separated) [通过弹窗编辑笔记标签 (逗号分隔)]
 */
export async function editTagsNote(noteId: string): Promise<void> {
  const note = await storageManager.getNoteById(noteId);
  if (!note) return;
  const current = (note.tags || []).join(', ');
  const input = window.prompt(t('noteMenu.editTagsPrompt'), current);
  if (input === null) return;
  const tags = input.split(',').map(s => s.trim()).filter(Boolean);
  await storageManager.updateNote(noteId, { tags });
  await refreshNoteListView();
}
