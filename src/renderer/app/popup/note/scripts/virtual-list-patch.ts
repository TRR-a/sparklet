// Virtual list: window patch + measurement [虚拟列表 - 窗口补丁与高度测量]
//
// Split out [已拆分]：height measurement → virtual-list-measure.ts,
// DOM rebuild → virtual-list-patch-dom.ts.

import { computeRange, getSidebar } from './virtual-list-geometry.js';
import {
  getItems,
  getFactories,
  getOffsets,
  getLastRange,
  setLastRange,
  getRafId,
  setRafId
} from './virtual-list-state.js';
import { evictDetachedCards } from './virtual-list-acquire.js';
import { getTopSpacer, getBottomSpacer } from './virtual-list-spacer.js';
import { measureRendered } from './virtual-list-measure.js';
import { patchListDom } from './virtual-list-patch-dom.js';

/**
 * Patch the DOM to match the current window (and measure real heights) [按当前窗口修补 DOM 并测量真实高度]
 * @param force Re-render even if the index range is unchanged [索引区间未变也强制重渲染]
 */
export function patchWindow(force = false): void {
  setRafId(0);
  const noteList = document.getElementById('noteList');
  if (!noteList || !getFactories()) return;

  const sidebar = getSidebar();
  const range: [number, number] = sidebar
    ? computeRange(getOffsets(), getItems().length, sidebar.scrollTop, sidebar.clientHeight)
    : [0, 0];
  const [start, end] = range;
  const last = getLastRange();
  if (!force && start === last[0] && end === last[1]) return;
  setLastRange([start, end]);

  const rendered = patchListDom(noteList, getTopSpacer(), getBottomSpacer(), start, end);

  evictDetachedCards();

  measureRendered(rendered, () => patchWindow(true));
}

/** Schedule a patch on the next animation frame [在下一帧调度补丁] */
export function schedulePatch(): void {
  if (!getRafId()) setRafId(requestAnimationFrame(() => patchWindow()));
}
