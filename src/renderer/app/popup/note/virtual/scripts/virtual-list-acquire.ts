// Virtual list: element acquisition + cache [虚拟列表 - 元素获取与缓存]

import type { VirtualItem } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-types.js';
import { cardCache, getItems, getFactories, getActiveNoteId } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-state.js';

/**
 * Get (from cache) or create the element for item index i [取缓存或创建第 i 项元素]
 */
export function acquireItemElement(i: number): HTMLElement {
  const item = getItems()[i];
  const factories = getFactories();
  if (!factories) throw new Error('virtual list factories not set');
  if (item.kind === 'card') {
    const key = `${item.variant}:${item.note.id}`;
    let el = cardCache.get(key);
    if (!el) {
      el = factories.createCard(item, getActiveNoteId());
      cardCache.set(key, el);
    } else {
      // Re-attach: sync transient state (active highlight / open menu) [重新挂载：同步临时状态 (高亮/打开的菜单)]
      if (item.variant === 'main') el.classList.toggle('active', item.note.id === getActiveNoteId());
      el.querySelector('.note-more-menu.show')?.classList.remove('show');
    }
    return el;
  }
  // Titles/empties are few and stateful (collapsed caret) - always fresh [标题/占位数量少且带状态 (折叠箭头)，始终新建]
  return item.kind === 'title' ? factories.createTitle(item as Extract<VirtualItem, { kind: 'title' }>) : factories.createEmpty(item as Extract<VirtualItem, { kind: 'empty' }>);
}

/** Evict detached cache entries when the cache grows too large [缓存过大时清理离屏元素] */
export function evictDetachedCards(maxSize = 400): void {
  if (cardCache.size <= maxSize) return;
  for (const [key, el] of cardCache) {
    if (!el.isConnected) cardCache.delete(key);
  }
}
