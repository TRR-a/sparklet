// Selection bar: DOM creation [多选操作栏 - DOM 创建]

import { onBarClick } from 'sparklet/renderer/app/popup/ui/selection/scripts/selection-bar-actions.js';

let barEl: HTMLElement | null = null;

/** Create the bar DOM once and insert it above the note list [一次性创建操作栏 DOM 并插入笔记列表上方] */
export function ensureBar(): HTMLElement {
  if (barEl) return barEl;
  barEl = document.createElement('div');
  barEl.id = 'selectionBar';
  barEl.className = 'selection-bar';
  barEl.style.display = 'none';
  barEl.innerHTML = `
    <span class="selection-count"></span>
    <div class="selection-actions">
      <button class="sel-btn select-all" data-action="select-all"></button>
      <button class="sel-btn batch-restore" data-action="restore"></button>
      <button class="sel-btn batch-delete" data-action="delete"></button>
      <button class="sel-btn batch-permanent" data-action="permanent"></button>
      <button class="sel-btn cancel" data-action="cancel"></button>
    </div>
  `;
  const noteList = document.getElementById('noteList');
  if (noteList && noteList.parentNode) {
    noteList.parentNode.insertBefore(barEl, noteList);
  }
  barEl.addEventListener('click', onBarClick);
  return barEl;
}
