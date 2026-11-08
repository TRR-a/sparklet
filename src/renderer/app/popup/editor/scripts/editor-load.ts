// Editor: load note into editor [编辑器 - 加载笔记]

import storageManager from 'sparklet/renderer/shared/storage/manager/storage-manager.js';
import { closeAllMenus } from 'sparklet/renderer/app/popup/note/scripts/note-menu.js';
import { syncActiveNoteInList } from 'sparklet/renderer/app/popup/note/scripts/note-virtual-list.js';
import { getPreviewMode, setPreviewMode, setCurrentNoteId } from 'sparklet/renderer/app/popup/editor/scripts/editor-state.js';
import { updateActiveColor } from 'sparklet/renderer/app/popup/editor/scripts/editor-color-indicator.js';

/**
 * Load note into editor [加载笔记到编辑器]
 */
export async function loadNoteIntoEditor(note: { id: string } | null): Promise<void> {
  if (!note) return;
  closeAllMenus();
  // Exit preview mode if active [如果处于预览模式则退出]
  if (getPreviewMode()) {
    setPreviewMode(false);
    const btn = document.getElementById('previewToggleBtn');
    if (btn) { btn.classList.remove('active'); btn.textContent = '👁️ 预览'; }
  }
  // Safety: ensure editor textarea is visible and preview is hidden [安全检查：确保编辑器文本区可见且预览隐藏]
  const ta = document.getElementById('noteArea');
  const pv = document.getElementById('notePreview');
  if (ta) (ta as HTMLElement).style.display = 'block';
  if (pv) (pv as HTMLElement).style.display = 'none';
  // Safety: clear stale blur-background if settings glow mask is not shown [安全清除残留的 blur-background (如果设置光晕未显示)]
  const glowMaskEl = document.getElementById('settingsGlowMask');
  if (document.body.classList.contains('blur-background') && glowMaskEl && !glowMaskEl.classList.contains('show')) {
    document.body.classList.remove('blur-background');
  }
  setCurrentNoteId(note.id);
  const fullNote = await storageManager.getNoteById(note.id);
  if (!fullNote) return;
  const titleInput = document.getElementById('noteTitle') as HTMLInputElement | null;
  const contentInput = document.getElementById('noteArea') as HTMLTextAreaElement | null;
  if (titleInput) titleInput.value = fullNote.title || '';
  if (contentInput) { contentInput.value = fullNote.content || ''; contentInput.scrollTop = 0; }
  updateActiveColor(fullNote.color);
  // Sync active card highlight through the virtual list (attached + cached cards) [经虚拟列表同步卡片高亮 (含离屏缓存卡片)]
  syncActiveNoteInList(note.id);
}
