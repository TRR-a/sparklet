// Selection bar: visibility / count / per-view buttons [多选操作栏 - 可见性、计数与按视图按钮]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { syncSelectionInList } from '../../../note/scripts/note-virtual-list.js';
import { isSelectionMode, getSelectedCount, isSelected } from './selection-state.js';
import { isTrashView } from './selection-bar-actions.js';
import { ensureBar } from './selection-bar-dom.js';

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
