// Selection bar - multi-select action toolbar [多选操作栏]
// Shown above the note list when selection mode is active. Buttons differ by
// view: main view offers batch delete (to trash); trash view offers batch
// restore and batch permanent delete.
// [多选模式激活时显示在笔记列表上方。按钮因视图而异：主视图提供批量删除
// (到回收站)；回收站提供批量恢复与批量永久删除]

import storageManager from '../../Modules/storage-manager.js';
import { t } from '../../Modules/i18n.js';
import { showCustomConfirm } from '../../Modules/custom-dialog.js';
import { getVirtualCardNoteIds, syncSelectionInList } from './note-virtual-list.js';
import {
  isSelectionMode,
  getSelectedCount,
  getSelectedIds,
  selectAll,
  clearSelection,
  exitSelectionMode,
  isSelected,
  onSelectionChange,
} from './selection-state.js';

let barEl: HTMLElement | null = null;
let initialized = false;

/** Current view via body class (set by trash-view) [通过 body class 判断当前视图 (由 trash-view 设置)] */
function isTrashView(): boolean {
  return document.body.classList.contains('trash-view');
}

/** Create the bar DOM once and insert it above the note list [一次性创建操作栏 DOM 并插入笔记列表上方] */
function ensureBar(): HTMLElement {
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

/** Refresh bar visibility, count and per-view buttons [刷新操作栏可见性、计数与按视图显示的按钮] */
export function updateSelectionBar(): void {
  const bar = ensureBar();
  const active = isSelectionMode();
  bar.style.display = active ? 'flex' : 'none';
  // Toggle body class so CSS can show checkboxes and hide per-card action buttons [切换 body class 使 CSS 显示复选框并隐藏单卡操作按钮]
  document.body.classList.toggle('selection-mode', active);
  // Sync selected state onto all attached and cached virtual-list cards [将选中态同步到所有已挂载与缓存的虚拟列表卡片]
  syncSelectionInList(isSelected);
  if (!active) return;

  const count = getSelectedCount();
  const countEl = bar.querySelector('.selection-count');
  if (countEl) countEl.textContent = t('selection.selectedCount').replace('{n}', String(count));

  const trash = isTrashView();
  const setBtn = (action: string, label: string, show: boolean, danger = false) => {
    const btn = bar.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
    if (!btn) return;
    btn.style.display = show ? '' : 'none';
    btn.textContent = label;
    btn.classList.toggle('danger', danger);
  };
  setBtn('select-all', t('selection.selectAll'), true);
  setBtn('restore', t('selection.restore'), trash);
  setBtn('delete', t('selection.deleteToTrash'), !trash);
  setBtn('permanent', t('selection.permanentDelete'), trash, true);
  setBtn('cancel', t('selection.cancel'), true);
}

/** Collect all ids in the current view for select-all [收集当前视图全部 id 用于全选] */
async function allIdsInView(): Promise<string[]> {
  if (isTrashView()) {
    const notes = await storageManager.getTrashNotes();
    return notes.map(n => n.id);
  }
  // Main view: visible cards in the current virtual model [主视图：当前虚拟模型中的可见卡片]
  const visible = getVirtualCardNoteIds();
  if (visible.length > 0) return visible;
  const notes = await storageManager.getNotes();
  return notes.map(n => n.id);
}

/** Bar click dispatcher [操作栏点击分发] */
async function onBarClick(e: MouseEvent): Promise<void> {
  const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  const ids = getSelectedIds();

  if (action === 'cancel') {
    exitSelectionMode();
    return;
  }
  if (action === 'select-all') {
    const all = await allIdsInView();
    // If everything already selected, clear instead (toggle) [若已全选则取消全选]
    if (all.length > 0 && all.every(id => ids.includes(id)) && ids.length === all.length) {
      clearSelection();
    } else {
      selectAll(all);
    }
    return;
  }
  if (ids.length === 0) return;

  if (action === 'delete') {
    const confirmed = await showCustomConfirm({
      title: t('selection.confirmDeleteTitle'),
      message: t('selection.confirmDeleteMessage').replace('{n}', String(ids.length)),
      okText: t('selection.deleteToTrash'),
      cancelText: t('confirm.default.cancel'),
    });
    if (!confirmed) return;
    await storageManager.deleteNotes(ids);
    await refreshCurrentView();
    exitSelectionMode();
  } else if (action === 'restore') {
    await storageManager.restoreNotes(ids);
    await refreshCurrentView();
    exitSelectionMode();
  } else if (action === 'permanent') {
    const confirmed = await showCustomConfirm({
      title: t('selection.confirmPermanentTitle'),
      message: t('selection.confirmPermanentMessage').replace('{n}', String(ids.length)),
      okText: t('selection.permanentDelete'),
      cancelText: t('confirm.default.cancel'),
      okDanger: true,
    });
    if (!confirmed) return;
    await storageManager.permanentlyDeleteNotes(ids);
    await refreshCurrentView();
    exitSelectionMode();
  }
}

/** Re-render the list of whichever view is active [重渲染当前激活视图的列表] */
async function refreshCurrentView(): Promise<void> {
  if (isTrashView()) {
    const { renderTrashList } = await import('./trash-view.js');
    await renderTrashList();
  } else {
    const { loadNotes } = await import('./note-editor.js');
    await loadNotes();
  }
}

/** Initialize the selection bar (call once) [初始化多选操作栏 (调用一次)] */
export function initSelectionBar(): void {
  if (initialized) return;
  initialized = true;
  ensureBar();
  onSelectionChange(updateSelectionBar);
}
