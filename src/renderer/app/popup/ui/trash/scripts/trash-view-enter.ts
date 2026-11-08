// Trash view: enter [回收站视图 - 进入]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { getPreviewMode, setPreviewMode } from 'sparklet/renderer/app/popup/editor/scripts/note-editor.js';
import { clearSearch } from 'sparklet/renderer/app/popup/note/list/scripts/note-search.js';
import { setCurrentView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-state.js';
import { renderTrashList } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-list.js';

/**
 * Enter trash view: swap chrome, clear search, hide editor controls, render list [进入回收站视图：换控件、清搜索、隐藏编辑控件、渲染列表]
 */
export async function enterTrashView(): Promise<void> {
  const trashToggleBtn = document.getElementById('trashToggle');
  const newNoteBtn = document.getElementById('newNoteBtn');
  const noteTitleInput = document.getElementById('noteTitle');
  const noteEditor = document.getElementById('noteArea');
  const colorPalette = document.querySelector('.color-palette') as HTMLElement | null;
  const editorToolbar = document.querySelector('.editor-toolbar') as HTMLElement | null;
  const notePreview = document.getElementById('notePreview');
  const searchBox = document.querySelector('.note-search-box') as HTMLElement | null;
  if (!trashToggleBtn) return;

  setCurrentView('trash');
  document.body.classList.add('trash-view');
  clearSearch(); // Search is main-view only [搜索仅主视图可用]
  if (searchBox) searchBox.style.display = 'none';
  // Exit preview mode if active [如果处于预览模式则退出]
  if (getPreviewMode()) {
    setPreviewMode(false);
    const btn = document.getElementById('previewToggleBtn');
    if (btn) { btn.classList.remove('active'); btn.textContent = '👁️ 预览'; }
  }
  (trashToggleBtn as HTMLElement).style.opacity = '1';
  (trashToggleBtn as HTMLElement).style.color = '#ea4335';
  (trashToggleBtn as HTMLElement).textContent = '←';
  (trashToggleBtn as HTMLElement).title = t('tooltip.backToNotes');
  if (newNoteBtn) (newNoteBtn as HTMLElement).style.display = 'none';
  if (noteTitleInput) (noteTitleInput as HTMLElement).style.display = 'none';
  if (noteEditor) (noteEditor as HTMLElement).style.display = 'none';
  if (colorPalette) colorPalette.style.display = 'none';
  if (editorToolbar) (editorToolbar as HTMLElement).style.display = 'none';
  // Show preview area with initial hint [显示预览区域并展示初始提示]
  if (notePreview) {
    notePreview.innerHTML = `<p class="trash-preview-hint">${t('main.trashPreviewHint')}</p>`;
    notePreview.style.display = 'block';
  }
  await renderTrashList();
}
