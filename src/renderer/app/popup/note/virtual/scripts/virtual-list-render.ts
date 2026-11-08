// Virtual list: render a flat model [虚拟列表 - 渲染展平模型]

import type { VirtualItem, VirtualFactories, VirtualRenderOptions } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-types.js';
import { setItems, setFactories, setActiveNoteId, cardCache, setLastRange, recomputeOffsets } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-state.js';
import { patchWindow } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-patch.js';

/**
 * Render a flat item model into the virtual list [将展平的条目模型渲染进虚拟列表]
 * Clears the element cache (models are rebuilt only when data changed) [清空元素缓存 (模型仅在数据变化时重建)]
 */
export function renderVirtualNoteList(newItems: VirtualItem[], newFactories: VirtualFactories, opts?: VirtualRenderOptions): void {
  setItems(newItems);
  setFactories(newFactories);
  if (opts) setActiveNoteId(opts.activeNoteId ?? null);
  cardCache.clear();
  setLastRange([-1, -1]);
  recomputeOffsets();
  patchWindow();
}
