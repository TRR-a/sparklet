// Note virtual list - barrel [笔记虚拟列表 - 汇总出口]
//
// Only items inside the viewport (plus a buffer) exist in the DOM; spacer li elements
// preserve the full virtual height inside #noteList so the sidebar scrollbar stays accurate.
// [仅视口内 (含缓冲区) 的条目存在于 DOM；上下占位 li 撑起完整虚拟高度，滚动条保持真实比例]
//
// Model producers (note-list.ts / trash-view.ts / note-search.ts) flatten groups into a
// VirtualItem[] and pass element factories; this module owns windowing, measurement and
// the detached-element cache used while scrolling.
// [模型生产方 (note-list / trash-view / note-search) 把分组展平为 VirtualItem[] 并传入元素工厂；
//  本模块负责窗口计算、高度测量与滚动期间的离屏元素缓存]
//
// Types in virtual-list-types.ts, geometry in virtual-list-geometry.ts,
// state in virtual-list-state.ts, patch in virtual-list-patch.ts,
// element cache in virtual-list-acquire.ts, sync helpers in virtual-list-sync.ts,
// spacers in virtual-list-spacer.ts, render in virtual-list-render.ts,
// active highlight in virtual-list-active-sync.ts, selection/lookup in
// virtual-list-selection-api.ts, listeners in virtual-list-init.ts.

export type {
  VirtualTitleItem,
  VirtualEmptyItem,
  VirtualCardItem,
  VirtualItem,
  VirtualFactories,
  VirtualRenderOptions,
} from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-types.js';

export { getActiveNoteId } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-state.js';
export { renderVirtualNoteList } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-render.js';
export { syncActiveNoteInList } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-active-sync.js';
export { syncSelectionInList, getVirtualCardNoteIds, scrollNoteIntoView } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-selection-api.js';
export { initVirtualList } from 'sparklet/renderer/app/popup/note/virtual/scripts/virtual-list-init.js';
