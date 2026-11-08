// Trash view: exit back to main [回收站视图 - 退回主视图]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { setCurrentView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-state.js';
import { loadMainView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-main.js';

/**
 * Exit trash view: restore main chrome, clear stale overlays, reload list [退出回收站视图：恢复主控件、清残留遮罩、重载列表]
 */
export async function exitTrashView(): Promise<void> {
  const trashToggleBtn = document.getElementById('trashToggle');
  const newNoteBtn = document.getElementById('newNoteBtn');
  const noteTitleInput = document.getElementById('noteTitle');
  const noteEditor = document.getElementById('noteArea');
  const colorPalette = document.querySelector('.color-palette') as HTMLElement | null;
  const editorToolbar = document.querySelector('.editor-toolbar') as HTMLElement | null;
  const notePreview = document.getElementById('notePreview');
  const searchBox = document.querySelector('.note-search-box') as HTMLElement | null;
  if (!trashToggleBtn) return;

  setCurrentView('main');
  document.body.classList.remove('trash-view');
  // Safety: clear stale blur-background and glow mask [安全清除残留 blur-background 和光晕遮罩]
  document.body.classList.remove('blur-background');
  const glowMask = document.getElementById('settingsGlowMask');
  if (glowMask) glowMask.classList.remove('show');
  (trashToggleBtn as HTMLElement).style.opacity = '0.7';
  (trashToggleBtn as HTMLElement).style.color = '';
  (trashToggleBtn as HTMLElement).textContent = '🗑️';
  (trashToggleBtn as HTMLElement).title = t('tooltip.trash');
  if (newNoteBtn) (newNoteBtn as HTMLElement).style.display = 'block';
  if (noteTitleInput) (noteTitleInput as HTMLElement).style.display = 'block';
  if (noteEditor) (noteEditor as HTMLElement).style.display = 'block';
  if (colorPalette) colorPalette.style.display = 'flex';
  if (editorToolbar) (editorToolbar as HTMLElement).style.display = 'flex';
  if (searchBox) searchBox.style.display = 'block';
  if (notePreview) {
    notePreview.style.display = 'none';
    notePreview.innerHTML = '';
  }
  await loadMainView();
}
