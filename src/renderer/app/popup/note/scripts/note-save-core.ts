// Note save: persist the open note [笔记保存 - 写入当前打开的笔记]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { getCurrentNoteId } from 'sparklet/renderer/app/popup/editor/scripts/note-editor.js';
import { refreshNoteListView } from 'sparklet/renderer/app/popup/note/list/scripts/note-search.js';
import { clearSaveTimers } from 'sparklet/renderer/app/popup/note/scripts/note-save-debounce.js';

/**
 * Save current note [保存当前笔记]
 */
export async function saveCurrentNote(): Promise<void> {
  clearSaveTimers();
  const currentNoteId = getCurrentNoteId();
  if (!currentNoteId) return;
  // Skip if in trash view (prevent renderNoteList overwriting trash list) [回收站视图中跳过 (防止 renderNoteList 覆盖回收站列表)]
  if (document.body.classList.contains('trash-view')) return;
  const titleInput = document.getElementById('noteTitle') as HTMLInputElement | null;
  const contentInput = document.getElementById('noteArea') as HTMLTextAreaElement | null;
  if (!titleInput || !contentInput) return;
  const title = titleInput.value.trim();
  const content = contentInput.value;
  const finalTitle = title || content.substring(0, 20) || t('main.noteUntitled');
  await storageManager.updateNote(currentNoteId, { title: finalTitle, content });
  // Keep the open note highlighted after the list re-renders [重渲染后保持当前打开笔记高亮]
  // Also refreshes search results when a search is active [搜索激活时同样刷新搜索结果]
  await refreshNoteListView();
}
