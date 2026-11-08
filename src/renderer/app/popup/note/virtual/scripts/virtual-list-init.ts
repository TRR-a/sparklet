// Virtual list: scroll/resize listeners [虚拟列表 - 滚动/缩放监听]

import { getSidebar } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-geometry.js';
import { schedulePatch } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-patch.js';

/**
 * Bind scroll/resize listeners (call once on init) [绑定滚动/缩放监听 (初始化时调用一次)]
 */
export function initVirtualList(): void {
  const sidebar = getSidebar();
  if (sidebar) sidebar.addEventListener('scroll', schedulePatch, { passive: true });
  window.addEventListener('resize', schedulePatch);
}
