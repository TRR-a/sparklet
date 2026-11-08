// Widget drag: pointer gesture [卡片拖拽 - 指针手势]

import { createGhost, moveGhost, dropGhost } from 'sparklet/renderer/welcome/widgets/scripts/widget-drag-ghost.js';
import { findBeforeCard, applyDropSlot } from 'sparklet/renderer/welcome/widgets/scripts/widget-drag-slot.js';
import { persistOrder } from 'sparklet/renderer/welcome/widgets/scripts/widget-order.js';

const DRAG_THRESHOLD_PX = 4;

/**
 * Start a drag gesture from a pointerdown event on the board [从 board 上的 pointerdown 启动一次拖拽]
 */
export function startWidgetDrag(e: PointerEvent, board: HTMLElement, card: HTMLElement): void {
  const startX = e.clientX;
  const startY = e.clientY;
  const rect = card.getBoundingClientRect();
  let started = false;
  let ghost: HTMLElement | null = null;

  const onMove = (ev: PointerEvent) => {
    if (!started) {
      const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
      if (dist < DRAG_THRESHOLD_PX) return;
      started = true;

      // Clone as the pointer-following ghost; the real card stays in the
      // grid flow and becomes the live preview [克隆体跟随指针；本体留在
      // grid 流中作为实时预览]
      ghost = createGhost(card, rect);
      card.classList.add('slot-preview');
    }
    moveGhost(ghost!, ev.clientX - startX, ev.clientY - startY);

    // Drop slot from pointer geometry — works over empty board areas too,
    // not only directly on a card [按指针几何推算落点，board 空白区域同样有效]
    const cards = Array.from(board.querySelectorAll<HTMLElement>('.widget'))
      .filter((w) => w !== card);
    applyDropSlot(board, card, findBeforeCard(cards, ev));
  };

  const finish = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', finish);
    document.removeEventListener('pointercancel', finish);
    if (started && ghost) {
      dropGhost(ghost, card);
      persistOrder(board);
    }
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', finish);
  document.addEventListener('pointercancel', finish);
}
