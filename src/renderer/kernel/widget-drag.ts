// Widget drag-to-reorder for the kernel home board [内核主页卡片拖拽重排]
// Pure pointer events, no dependency. The card itself stays in the grid flow
// as the live drop preview — its slot resizes in real time, exactly matching
// what dropping there will produce — while a fixed-position clone follows the
// pointer as the drag ghost. The resulting DOM order is persisted to the store
// so the layout survives restarts.
// [纯 pointer 事件实现，零依赖。卡片本体留在 grid 流中作为实时落点预览——槽位
//  尺寸即时重排，与松手后的真实结果完全一致；fixed 定位的克隆体作为拖拽幽灵
//  跟随指针。松手后的 DOM 顺序写入 store，重启后保持]

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
    let ghost: HTMLElement | null = null;

    const onMove = (ev: PointerEvent) => {
      if (!started) {
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (dist < DRAG_THRESHOLD_PX) return;
        started = true;

        // Clone as the pointer-following ghost; the real card stays in the
        // grid flow and becomes the live preview [克隆体跟随指针；本体留在
        // grid 流中作为实时预览]
        ghost = card.cloneNode(true) as HTMLElement;
        ghost.classList.add('dragging');
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        ghost.style.left = `${rect.left}px`;
        ghost.style.top = `${rect.top}px`;
        ghost.style.margin = '0';
        document.body.appendChild(ghost);

        card.classList.add('slot-preview');
      }
      ghost!.style.transform = `translate(${ev.clientX - startX}px, ${ev.clientY - startY}px)`;

      // Drop slot from pointer geometry — works over empty board areas too,
      // not only directly on a card: a card counts as "before the pointer" when
      // the pointer sits in its upper half, or left of its center within the
      // lower half; the card moves before the first such card, else last.
      // [按指针几何推算落点：board 空白区域同样有效，不要求压在卡片上。
      //  指针位于卡片上半，或下半的左侧，即视为"在该卡之前"；卡片本体移动到
      //  第一张满足条件的卡之前，否则追加末尾——grid 即时重排，预览尺寸
      //  始终等于松手后的真实尺寸]
      const cards = Array.from(board.querySelectorAll<HTMLElement>('.widget'))
        .filter((w) => w !== card);
      const before = cards.find((c) => {
        const r = c.getBoundingClientRect();
        return ev.clientY < r.top + r.height / 2
          || (ev.clientY < r.bottom && ev.clientX < r.left + r.width / 2);
      });
      // Skip no-op moves to avoid needless reflows per pointer frame
      // [跳过无效移动，避免每个指针帧触发无谓重排]
      const inPlace = before ? before.previousElementSibling === card
        : board.lastElementChild === card;
      if (!inPlace) {
        if (before) board.insertBefore(card, before);
        else board.appendChild(card);
      }
    };

    const finish = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', finish);
      document.removeEventListener('pointercancel', finish);
      if (started && ghost) {
        ghost.remove();
        card.classList.remove('slot-preview');
        persistOrder(board);
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', finish);
    document.addEventListener('pointercancel', finish);
  });
}
