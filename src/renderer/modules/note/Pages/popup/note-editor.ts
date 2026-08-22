// Popup note editor - handles note loading, editing state, and list rendering [弹窗笔记编辑器 - 处理笔记加载、编辑状态和列表渲染]
// Note operations (save/create/delete/color) moved to note-operations.ts [笔记操作 (保存/创建/删除/颜色) 已移至 note-operations.ts]

import storageManager from '../../Modules/storage-manager.js';
import { t } from '../../Modules/i18n.js';
import { formatDate } from '../../Base/dom-utils.js';
import { renderMarkdown } from '../../Modules/markdown.js';
import {
  saveCurrentNote,
  createNewNote,
  handleDeleteNote
} from './note-operations.js';

// Re-export note operations for backward compatibility [重新导出笔记操作以保持向后兼容]
export { saveCurrentNote, debounceSave, createNewNote, changeNoteColor } from './note-operations.js';

/** Preview mode state [预览模式状态] */
let isPreviewMode = false;

/** Current active note ID [当前选中的笔记 ID] */
let currentNoteId: string | null = null;

/**
 * Update active color indicator [更新颜色选中状态]
 */
export function updateActiveColor(color: string): void {
  document.querySelectorAll('.color-option').forEach((btn: Element) => {
    btn.classList.toggle('active', btn.getAttribute('data-color') === color);
  });
}

/**
 * Load note into editor [加载笔记到编辑器]
 */
export async function loadNoteIntoEditor(note: { id: string } | null): Promise<void> {
  if (!note) return;
  // Exit preview mode if active [如果处于预览模式则退出]
  if (isPreviewMode) {
    isPreviewMode = false;
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
  currentNoteId = note.id;
  const fullNote = await storageManager.getNoteById(note.id);
  if (!fullNote) return;
  const titleInput = document.getElementById('noteTitle') as HTMLInputElement | null;
  const contentInput = document.getElementById('noteArea') as HTMLTextAreaElement | null;
  if (titleInput) titleInput.value = fullNote.title || '';
  if (contentInput) contentInput.value = fullNote.content || '';
  updateActiveColor(fullNote.color);
  document.querySelectorAll('.note-list-item').forEach((item: Element) => {
    item.classList.toggle('active', item.getAttribute('data-note-id') === note.id);
  });
}

/**
 * Render the note list [渲染笔记列表]
 */
export async function renderNoteList(notes: Array<{ id: string; color: string; title: string; updatedAt: string }>): Promise<void> {
  const noteList = document.getElementById('noteList');
  if (!noteList) return;
  noteList.innerHTML = '';
  notes.forEach(note => {
    const li = document.createElement('li');
    li.className = 'note-list-item';
    li.setAttribute('data-note-id', note.id);
    li.style.setProperty('--note-color', note.color);
    if (note.id === currentNoteId) li.classList.add('active');
    li.innerHTML = `
      <span class="note-color-dot" style="background-color: ${note.color};"></span>
      <div class="note-text">
        <div class="note-title">${note.title || t('main.noteUntitled')}<span class="note-format-tag">(MD)</span></div>
        <div class="note-filename">${note.id}.md</div>
        <div class="note-time">${formatDate(note.updatedAt)}</div>
      </div>
      <button class="note-delete-btn" data-i18n-title="tooltip.deleteNote" title="${t('tooltip.deleteNote')}">🗑️</button>
    `;
    li.addEventListener('click', (e: MouseEvent) => {
      if (!(e.target as HTMLElement).classList.contains('note-delete-btn')) switchNote(note.id);
    });
    const deleteBtn = li.querySelector('.note-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e: Event) => {
        e.stopPropagation();
        await handleDeleteNote(note.id, li);
      });
    }
    noteList.appendChild(li);
  });
}

/**
 * Switch to a different note [切换笔记]
 */
export async function switchNote(noteId: string): Promise<void> {
  await saveCurrentNote();
  const note = await storageManager.getNoteById(noteId);
  if (note) await loadNoteIntoEditor(note);
}

/**
 * Toggle markdown preview mode [切换 Markdown 预览模式]
 */
export async function togglePreview(): Promise<void> {
  const textarea = document.getElementById('noteArea');
  const preview = document.getElementById('notePreview');
  const btn = document.getElementById('previewToggleBtn');
  if (!textarea || !preview || !btn) return;

  isPreviewMode = !isPreviewMode;

  if (isPreviewMode) {
    await saveCurrentNote();
    preview.innerHTML = renderMarkdown((textarea as HTMLTextAreaElement).value);
    (textarea as HTMLElement).style.display = 'none';
    (preview as HTMLElement).style.display = 'block';
    btn.classList.add('active');
    btn.textContent = '✏️ 编辑';
  } else {
    (textarea as HTMLElement).style.display = 'block';
    (preview as HTMLElement).style.display = 'none';
    btn.classList.remove('active');
    btn.textContent = '👁️ 预览';
  }
}

/** Set current note ID (for trash module access) [设置当前笔记 ID (供回收站模块访问)] */
export function setCurrentNoteId(id: string | null): void {
  currentNoteId = id;
}

/** Get current note ID [获取当前笔记 ID] */
export function getCurrentNoteId(): string | null {
  return currentNoteId;
}

/** Set preview mode state [设置预览模式状态] */
export function setPreviewMode(value: boolean): void {
  isPreviewMode = value;
}

/** Get preview mode state [获取预览模式状态] */
export function getPreviewMode(): boolean {
  return isPreviewMode;
}

/**
 * Load notes on startup [启动时加载笔记]
 */
export async function loadNotes(): Promise<void> {
  await storageManager.init();
  // Bind preview toggle button once (avoid listener accumulation) [绑定预览切换按钮 (避免监听器累积)]
  const previewToggleBtn = document.getElementById('previewToggleBtn');
  if (previewToggleBtn) previewToggleBtn.addEventListener('click', togglePreview);
  const notes = await storageManager.getNotes();
  if (notes.length === 0) {
    const newNote = await storageManager.createNote(t('main.noteUntitled'));
    currentNoteId = newNote.id;
    await renderNoteList([newNote]);
    await loadNoteIntoEditor(newNote);
  } else {
    await renderNoteList(notes);
    // Get first note's complete content (including content) [获取第一个笔记的完整内容 (包含 content)]
    const firstNote = await storageManager.getNoteById(notes[0].id);
    if (firstNote) {
      currentNoteId = firstNote.id;
      await loadNoteIntoEditor(firstNote);
    } else {
      // Fallback [容错]
      currentNoteId = notes[0].id;
      await loadNoteIntoEditor(notes[0]);
    }
  }
}
