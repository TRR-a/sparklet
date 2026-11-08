// Widget board: persisted order [主页卡片 - 顺序持久化]

import { storeApi } from 'sparklet/renderer/shared/index.js';

export const WIDGET_ORDER_KEY = 'kernel.widgetOrder';
export const DEFAULT_ORDER = ['calendar', 'digital', 'analog', 'monitor'];

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
export function persistOrder(board: HTMLElement): void {
  const ids = Array.from(board.querySelectorAll<HTMLElement>('.widget'))
    .map((w) => w.dataset.widget)
    .filter((id): id is string => Boolean(id));
  void storeApi.set(WIDGET_ORDER_KEY, ids);
}
