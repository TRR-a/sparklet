// Virtual list geometry: height model [虚拟列表几何 - 高度模型]

import type { VirtualItem } from './virtual-list-types.js';

/** Card margin-bottom from note-list.css (must stay in sync) [卡片下边距 (与 note-list.css 保持同步)] */
export const CARD_MARGIN = 6;

/** Buffer rendered above/below the viewport in px [视口上下额外渲染的缓冲像素] */
export const VIEWPORT_BUFFER = 240;

/** Height estimates used before first measurement [首次测量前的高度估计值] */
export const HEIGHT_ESTIMATES: Record<string, number> = {
  'card:main': 62,
  'card:trash': 84,
  'title': 33,
  'empty': 32,
};

/** Height key per item kind (kind or kind:variant) [按类型的高度键] */
export function heightKey(item: VirtualItem): string {
  return item.kind === 'card' ? `card:${item.variant}` : item.kind;
}

/** Measured-or-estimated height for one item [单项测量或估计高度] */
export function itemHeight(item: VirtualItem, heights: Map<string, number>): number {
  return heights.get(heightKey(item)) ?? HEIGHT_ESTIMATES[heightKey(item)] ?? 60;
}

/** Compute cumulative offsets for the whole model [计算整个模型的累计偏移] */
export function computeOffsets(items: VirtualItem[], heights: Map<string, number>): number[] {
  const offsets = new Array<number>(items.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < items.length; i++) {
    offsets[i + 1] = offsets[i] + itemHeight(items[i], heights);
  }
  return offsets;
}
