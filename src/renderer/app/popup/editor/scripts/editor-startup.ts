// Editor: startup note loading [编辑器 - 启动时加载]

import storageManager from 'sparklet/renderer/shared/storage/storage-manager.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { renderNoteList } from '../../note/scripts/note-list.js';
import { bindNoteMenuGlobalHandler } from '../../note/scripts/note-menu.js';
import { bindNoteInfoModalHandlers } from '../../modals/scripts/note-info-modal.js';
import { getCurrentNoteId, setCurrentNoteId } from './editor-state.js';
import { loadNoteIntoEditor } from './editor-load.js';
import { togglePreview } from './editor-preview.js';

/**
 * Load notes on startup [启动时加载笔记]
 */
export async function loadNotes(): Promise<void> {
  await storageManager.init();
  bindNoteMenuGlobalHandler();
  bindNoteInfoModalHandlers();
  // Bind preview toggle button once (avoid listener accumulation) [绑定预览切换按钮 (避免监听器累积)]
  const previewToggleBtn = document.getElementById('previewToggleBtn');
  if (previewToggleBtn) previewToggleBtn.addEventListener('click', togglePreview);
  const notes = await storageManager.getNotes();
  if (notes.length === 0) {
    const newNote = await storageManager.createNote(t('main.noteUntitled'));
    setCurrentNoteId(newNote.id);
    await renderNoteList([newNote], getCurrentNoteId());
    await loadNoteIntoEditor(newNote);
  } else {
    await renderNoteList(notes, getCurrentNoteId());
    // Get first note's complete content (including content) [获取第一个笔记的完整内容 (包含 content)]
    const firstNote = await storageManager.getNoteById(notes[0].id);
    if (firstNote) {
      setCurrentNoteId(firstNote.id);
      await loadNoteIntoEditor(firstNote);
    } else {
      // Fallback [容错]
      setCurrentNoteId(notes[0].id);
      await loadNoteIntoEditor(notes[0]);
    }
  }
}
