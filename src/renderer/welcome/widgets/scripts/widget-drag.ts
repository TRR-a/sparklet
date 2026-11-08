// Widget drag-to-reorder for the kernel home board [内核主页卡片拖拽重排]
// Pure pointer events, no dependency. The card itself stays in the grid flow
// as the live drop preview — its slot resizes in real time, exactly matching
// what dropping there will produce — while a fixed-position clone follows the
// pointer as the drag ghost. The resulting DOM order is persisted to the store
// so the layout survives restarts.
// [纯 pointer 事件实现，零依赖。卡片本体留在 grid 流中作为实时落点预览——槽位
//  尺寸即时重排，与松手后的真实结果完全一致；fixed 定位的克隆体作为拖拽幽灵
//  跟随指针。松手后的 DOM 顺序写入 store，重启后保持]
//
// Split out [已拆分]：order persistence → widget-order.ts, ghost → widget-drag-ghost.ts,
// slot geometry → widget-drag-slot.ts, gesture → widget-drag-gesture.ts.

import { startWidgetDrag } from 'sparklet/renderer/welcome/widgets/scripts/widget-drag-gesture.js';

export { restoreWidgetOrder, persistOrder } from 'sparklet/renderer/welcome/widgets/scripts/widget-order.js';

/** Wire pointer-based drag reordering on the board [在 board 上绑定 pointer 拖拽重排] */
export function enableWidgetDragReorder(board: HTMLElement): void {
  board.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    // Ignore drags that start on interactive controls [从按钮/输入控件上按下不触发拖拽]
    if (target?.closest('button, a, input, select, textarea')) return;
    const card = target?.closest<HTMLElement>('.widget');
    if (!card || !board.contains(card)) return;
    startWidgetDrag(e, board, card);
  });
}
