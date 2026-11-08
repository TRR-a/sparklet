// Trash view: Esc returns to main [回收站视图 - Esc 返回主笔记]

import { getCurrentView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-state.js';
import { toggleTrashView } from 'sparklet/renderer/app/popup/ui/trash/scripts/trash-view-toggle.js';

// Esc in trash view returns to main notes (capture phase; modals keep their own Esc) [回收站中按 Esc 返回主笔记 (capture 阶段；弹窗保留自身 Esc 处理)]
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || getCurrentView() !== 'trash') return;
  const modalOpen = ['customConfirmModal', 'noteInfoModal', 'noteHistoryModal', 'shortcutModal', 'exitConfirmModal']
    .some(id => {
      const el = document.getElementById(id);
      return el !== null && (el as HTMLElement).style.display !== 'none';
    });
  if (modalOpen) return;
  e.preventDefault();
  e.stopPropagation();
  void toggleTrashView();
}, true);
