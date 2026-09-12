// Widget drag-to-reorder for the kernel home board [内核主页卡片拖拽重排]
// Pure pointer events, no dependency. Cards become fixed while dragging, a dashed
// placeholder marks the drop slot, and the resulting DOM order is persisted to the
// store so the layout survives restarts.
// [纯 pointer 事件实现，零依赖。拖动时卡片 fixed 跟随鼠标，虚线占位符标记落点，
//  松手后的 DOM 顺序写入 store，重启后保持]

import { storeApi } from '../core/index.js';

const WIDGET_ORDER_KEY = 'kernel.widgetOrder';
const DEFAULT_ORDER = ['calendar', 'digital', 'analog', 'monitor'];
const DRAG_THRESHOLD_PX = 4;

/** Restore saved card order; unknown/new cards append at the end [恢复保存的卡片顺序；未知/新卡片追加末尾] */
export async function restoreWidgetOrder(board: HTMLElement): Promise<void> {
  const saved = await storeApi.get<string[]>(WIDGET_ORDER_KEY);
  const order = Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_ORDER;

  const byId = new Map<string, HTMLElement>();
  board.querySelectorAll<HTMLElement>('.widget').forEach((w) => {
    const id = w.dataset.widget;
    if (id) byId.set(id, w);
  });

  for (const id of order) {
    const el = byId.get(id);
    if (el) board.appendChild(el);
  }
  byId.forEach((el, id) => {
    if (!order.includes(id)) board.appendChild(el);
  });
}

/** Persist the current DOM order of widgets [持久化当前卡片 DOM 顺序] */
function persistOrder(board: HTMLElement): void {
  const ids = Array.from(board.querySelectorAll<HTMLElement>('.widget'))
    .map((w) => w.dataset.widget)
    .filter((id): id is string => Boolean(id));
  void storeApi.set(WIDGET_ORDER_KEY, ids);
}

/** Wire pointer-based drag reordering on the board [在 board 上绑定 pointer 拖拽重排] */
export function enableWidgetDragReorder(board: HTMLElement): void {
  board.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    // Ignore drags that start on interactive controls [从按钮/输入控件上按下不触发拖拽]
    if (target?.closest('button, a, input, select, textarea')) return;
    const card = target?.closest<HTMLElement>('.widget');
    if (!card || !board.contains(card)) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = card.getBoundingClientRect();
    let started = false;
    let placeholder: HTMLElement | null = null;

    const onMove = (ev: PointerEvent) => {
      if (!started) {
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (dist < DRAG_THRESHOLD_PX) return;
        started = true;

        card.classList.add('dragging');
        card.style.width = `${rect.width}px`;
        card.style.left = `${rect.left}px`;
        card.style.top = `${rect.top}px`;
        card.style.margin = '0';

        placeholder = document.createElement('div');
        placeholder.className = 'widget-placeholder';
        placeholder.style.height = `${rect.height}px`;
        board.insertBefore(placeholder, card);
      }
      // Follow the pointer [跟随指针]
      card.style.transform = `translate(${ev.clientX - startX}px, ${ev.clientY - startY}px)`;

      // Pick the card under the pointer to decide the drop slot [按指针下方卡片决定落点]
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const over = el?.closest?.('.widget');
      if (over && over !== card && placeholder) {
        const r = over.getBoundingClientRect();
        const afterY = ev.clientY - r.top > r.height / 2;
        board.insertBefore(placeholder, afterY ? over.nextSibling : over);
      }
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      if (started && placeholder) {
        board.insertBefore(card, placeholder);
        placeholder.remove();
        card.classList.remove('dragging');
        card.style.width = card.style.left = card.style.top = card.style.transform = '';
        persistOrder(board);
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  });
}
