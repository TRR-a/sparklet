// Virtual list: shared state [虚拟列表 - 共享状态]

import type { VirtualItem, VirtualFactories } from './virtual-list-types.js';
import { computeOffsets } from './virtual-list-geometry.js';

/** Flat item model [展平的条目模型] */
let items: VirtualItem[] = [];
/** Element factories injected by producers [由模型生产方注入的元素工厂] */
let factories: VirtualFactories | null = null;
/** Currently active note id [当前选中的笔记 id] */
let activeNoteId: string | null = null;
/** Cumulative offsets per index [每个索引的累计偏移] */
let offsets: number[] = [0];
/** Total virtual height [虚拟总高度] */
let totalHeight = 0;
/** Currently rendered index range [start, end) [当前渲染的索引区间] */
let lastRange: [number, number] = [-1, -1];
/** Pending rAF id for scroll-triggered patches [滚动触发的 rAF 补丁 id] */
let rafId = 0;

/** Measured heights per kind (kind or kind:variant) [按类型测量得到的高度] */
export const heights = new Map<string, number>();

/** Detached card elements reused while scrolling (key = variant:noteId) [滚动期间复用的离屏卡片缓存] */
export const cardCache = new Map<string, HTMLElement>();

// ==================== Accessors [访问器] ====================

export function getItems(): VirtualItem[] { return items; }
export function setItems(next: VirtualItem[]): void { items = next; }

export function getFactories(): VirtualFactories | null { return factories; }
export function setFactories(next: VirtualFactories | null): void { factories = next; }

export function getActiveNoteId(): string | null { return activeNoteId; }
export function setActiveNoteId(next: string | null): void { activeNoteId = next; }

export function getOffsets(): number[] { return offsets; }
export function getTotalHeight(): number { return totalHeight; }

export function getLastRange(): [number, number] { return lastRange; }
export function setLastRange(next: [number, number]): void { lastRange = next; }

export function getRafId(): number { return rafId; }
export function setRafId(next: number): void { rafId = next; }

/** Recompute offsets and total height from the current model + measured heights [按当前模型与测量高度重算偏移和总高] */
export function recomputeOffsets(): void {
  offsets = computeOffsets(items, heights);
  totalHeight = offsets[items.length];
}
