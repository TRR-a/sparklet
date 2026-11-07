// Virtual list: real-height measurement [虚拟列表 - 真实高度测量]

import type { VirtualItem } from './virtual-list-types.js';
import { CARD_MARGIN, HEIGHT_ESTIMATES, heightKey } from './virtual-list-geometry.js';
import { heights, recomputeOffsets } from './virtual-list-state.js';

/**
 * Measure the real height of each rendered kind; if estimates were off, recompute
 * offsets and patch once more [测量各类条目的真实高度；若有偏差则重算偏移并再补丁一次]
 * @param rerender Callback performing one forced patch [执行一次强制补丁的回调]
 */
export function measureRendered(
  rendered: { item: VirtualItem; el: HTMLElement }[],
  rerender: () => void
): void {
  const seen = new Set<string>();
  let changed = false;
  for (const { item, el } of rendered) {
    const key = heightKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    const h = el.getBoundingClientRect().height + (item.kind === 'card' ? CARD_MARGIN : 0);
    const prev = heights.get(key) ?? HEIGHT_ESTIMATES[key] ?? 60;
    if (Math.abs(h - prev) >= 1) {
      heights.set(key, h);
      changed = true;
    }
  }
  if (changed) {
    recomputeOffsets();
    rerender(); // One extra pass with correct heights; measurement is now stable [用正确高度再补丁一次；此后测量稳定]
  }
}
