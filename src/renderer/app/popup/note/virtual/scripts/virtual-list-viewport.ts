// Virtual list geometry: viewport & visible range [虚拟列表几何 - 视口与可见区间]

import { VIEWPORT_BUFFER } from './virtual-list-heights.js';

/** Sidebar scroll container [侧栏滚动容器] */
export function getSidebar(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.sidebar');
}

/** First item index whose bottom edge is below `top` [底部边低于 top 的第一个索引] */
function lowerBoundByBottom(offsets: number[], top: number): number {
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid + 1] <= top) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** First item index whose top edge is at/after `bottom` [顶部边不低于 bottom 的第一个索引] */
function lowerBoundByTop(offsets: number[], start: number, bottom: number): number {
  let lo = start;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] >= bottom) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/**
 * Compute the visible index range [start, end) [计算可见索引区间]
 */
export function computeRange(
  offsets: number[],
  itemCount: number,
  scrollTop: number,
  clientHeight: number
): [number, number] {
  if (itemCount === 0) return [0, 0];
  const top = scrollTop - VIEWPORT_BUFFER;
  const bottom = scrollTop + clientHeight + VIEWPORT_BUFFER;
  const start = lowerBoundByBottom(offsets, top);
  return [start, lowerBoundByTop(offsets, start, bottom)];
}
