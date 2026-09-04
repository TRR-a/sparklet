// Note info modal - read-only note details popup and close handlers [笔记信息弹窗 - 只读笔记详情与关闭处理]

import storageManager from '../../Modules/storage-manager.js';
import { t } from '../../Modules/i18n.js';
import { formatDate } from '../../Base/dom-utils.js';

/**
 * Show note detail info modal [显示笔记详细信息弹窗]
 */
export async function showNoteInfo(noteId: string): Promise<void> {
  const note = await storageManager.getNoteById(noteId);
  if (!note) return;

  const modal = document.getElementById('noteInfoModal');
  const bodyEl = document.getElementById('noteInfoBody');
  if (!modal || !bodyEl) return;

  const wordCount = note.content ? note.content.length : 0;
  const lineCount = note.content ? note.content.split('\n').length : 0;

  bodyEl.innerHTML = `
    <div class="info-row"><span class="info-label">${t('noteInfo.label.title')}</span><span class="info-value">${note.title || t('main.noteUntitled')}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.filename')}</span><span class="info-value info-mono">${note.id}.md</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.createdAt')}</span><span class="info-value">${formatDate(note.createdAt)}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.updatedAt')}</span><span class="info-value">${formatDate(note.updatedAt)}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.charCount')}</span><span class="info-value">${wordCount}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.lineCount')}</span><span class="info-value">${lineCount}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.pinned')}</span><span class="info-value">${note.pinned ? '📌 ' + t('noteInfo.value.yes') : t('noteInfo.value.no')}</span></div>
    <div class="info-row"><span class="info-label">${t('noteInfo.label.starred')}</span><span class="info-value">${note.starred ? '⭐ ' + t('noteInfo.value.yes') : t('noteInfo.value.no')}</span></div>
  `;

  (modal as HTMLElement).style.display = 'flex';
}

/**
 * Bind note info modal close handlers (overlay click + close button, call once on init) [绑定信息弹窗关闭处理器 (遮罩点击 + 关闭按钮，初始化时调用一次)]
 */
export function bindNoteInfoModalHandlers(): void {
  // Close note info modal on overlay click [点击遮罩关闭详细信息弹窗]
  const modal = document.getElementById('noteInfoModal');
  if (modal) {
    modal.addEventListener('click', (e: MouseEvent) => {
      if (e.target === modal) {
        (modal as HTMLElement).style.display = 'none';
      }
    });
  }
  const closeBtn = document.getElementById('noteInfoCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const m = document.getElementById('noteInfoModal');
      if (m) (m as HTMLElement).style.display = 'none';
    });
  }
}
