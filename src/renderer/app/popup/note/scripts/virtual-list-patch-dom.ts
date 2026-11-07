// Virtual list: DOM patching for a window range [虚拟列表 - 按窗口区间修补 DOM]

import type { VirtualItem } from './virtual-list-types.js';
import { getItems, getOffsets, getTotalHeight } from './virtual-list-state.js';
import { acquireItemElement } from './virtual-list-acquire.js';

/**
 * Rebuild the list from the given index range, updating spacers [按给定索引区间重建列表并更新占位块]
 * @returns The rendered item/element pairs, for measurement [已渲染的条目/元素对，供高度测量]
 */
export function patchListDom(
  noteList: HTMLElement,
  topSpacer: HTMLElement,
  bottomSpacer: HTMLElement,
  start: number,
  end: number
): Array<{ item: VirtualItem; el: HTMLElement }> {
  const offsets = getOffsets();
  topSpacer.style.height = `${offsets[start]}px`;
  bottomSpacer.style.height = `${Math.max(0, getTotalHeight() - offsets[end])}px`;

  const fragment = document.createDocumentFragment();
  const rendered: { item: VirtualItem; el: HTMLElement }[] = [];
  const items = getItems();
  for (let i = start; i < end; i++) {
    const el = acquireItemElement(i);
    fragment.appendChild(el);
    rendered.push({ item: items[i], el });
  }
  noteList.replaceChildren(topSpacer, fragment, bottomSpacer);
  return rendered;
}
