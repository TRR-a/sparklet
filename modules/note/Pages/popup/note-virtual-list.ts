// Note virtual list - windowed rendering for large note lists [笔记虚拟列表 - 大列表窗口化渲染]
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

import type { NoteListItem } from './note-list.js';

/** Group title item [分组标题条目] */
export interface VirtualTitleItem {
  kind: 'title';
  key: string;
  label: string;
}

/** Empty-group placeholder item [空分组占位条目] */
export interface VirtualEmptyItem {
  kind: 'empty';
  /** Custom hint text (defaults to noteList.empty) [自定义提示文本 (默认 noteList.empty)] */
  label?: string;
}

/** Note card item [笔记卡片条目] */
export interface VirtualCardItem {
  kind: 'card';
  note: NoteListItem;
  variant: 'main' | 'trash';
}

/** Flattened list item [展平后的列表条目] */
export type VirtualItem = VirtualTitleItem | VirtualEmptyItem | VirtualCardItem;

/** Element factories for the three item kinds [三种条目的元素工厂] */
export interface VirtualFactories {
  createTitle(item: VirtualTitleItem): HTMLElement;
  createEmpty(item: VirtualEmptyItem): HTMLElement;
  createCard(item: VirtualCardItem, activeNoteId: string | null): HTMLElement;
}

/** Render options [渲染选项] */
export interface VirtualRenderOptions {
  /** Currently active note for card highlight [当前选中笔记 (卡片高亮)] */
  activeNoteId?: string | null;
}

// ==================== State [状态] ====================

/** Card margin-bottom from note-list.css (must stay in sync) [卡片下边距 (与 note-list.css 保持同步)] */
const CARD_MARGIN = 6;

/** Buffer rendered above/below the viewport in px [视口上下额外渲染的缓冲像素] */
const VIEWPORT_BUFFER = 240;

/** Height estimates used before first measurement [首次测量前的高度估计值] */
const HEIGHT_ESTIMATES: Record<string, number> = {
  'card:main': 62,
  'card:trash': 84,
  'title': 33,
  'empty': 32,
};

let items: VirtualItem[] = [];
let factories: VirtualFactories | null = null;
let activeNoteId: string | null = null;
let offsets: number[] = [0];
let totalHeight = 0;

/** Measured heights per kind (kind or kind:variant) [按类型测量得到的高度] */
const heights = new Map<string, number>();

/** Detached card elements reused while scrolling (key = variant:noteId) [滚动期间复用的离屏卡片缓存] */
const cardCache = new Map<string, HTMLElement>();

/** Currently rendered index range [start, end) [当前渲染的索引区间] */
let lastRange: [number, number] = [-1, -1];

/** Pending rAF id for scroll-triggered patches [滚动触发的 rAF 补丁 id] */
let rafId = 0;

const topSpacer = document.createElement('li');
topSpacer.className = 'virtual-spacer';
const bottomSpacer = document.createElement('li');
bottomSpacer.className = 'virtual-spacer';

// ==================== Geometry helpers [几何计算] ====================

function heightKey(item: VirtualItem): string {
  return item.kind === 'card' ? `card:${item.variant}` : item.kind;
}

function itemHeight(item: VirtualItem): number {
  return heights.get(heightKey(item)) ?? HEIGHT_ESTIMATES[heightKey(item)] ?? 60;
}

function recomputeOffsets(): void {
  offsets = new Array(items.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < items.length; i++) {
    offsets[i + 1] = offsets[i] + itemHeight(items[i]);
  }
  totalHeight = offsets[items.length];
}

function getSidebar(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.sidebar');
}

// ==================== Window patching [窗口补丁] ====================

/**
 * Get (from cache) or create the element for item index i [取缓存或创建第 i 项元素]
 */
function acquire(i: number): HTMLElement {
  const item = items[i];
  if (item.kind === 'card') {
    const key = `${item.variant}:${item.note.id}`;
    let el = cardCache.get(key);
    if (!el) {
      el = factories!.createCard(item, activeNoteId);
      cardCache.set(key, el);
    } else {
      // Re-attach: sync transient state (active highlight / open menu) [重新挂载：同步临时状态 (高亮/打开的菜单)]
      if (item.variant === 'main') el.classList.toggle('active', item.note.id === activeNoteId);
      el.querySelector('.note-more-menu.show')?.classList.remove('show');
    }
    return el;
  }
  // Titles/empties are few and stateful (collapsed caret) - always fresh [标题/占位数量少且带状态 (折叠箭头)，始终新建]
  return item.kind === 'title' ? factories!.createTitle(item) : factories!.createEmpty(item);
}

/**
 * Compute the visible index range [计算可见索引区间]
 */
function computeRange(): [number, number] {
  const sidebar = getSidebar();
  if (!sidebar || items.length === 0) return [0, 0];
  const top = sidebar.scrollTop - VIEWPORT_BUFFER;
  const bottom = sidebar.scrollTop + sidebar.clientHeight + VIEWPORT_BUFFER;

  // Binary search: first index whose bottom edge is below `top` [二分：底部边低于 top 的第一个索引]
  let lo = 0;
  let hi = items.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid + 1] <= top) lo = mid + 1;
    else hi = mid;
  }
  const start = lo;

  // Binary search: first index whose top edge is at/after `bottom` [二分：顶部边不低于 bottom 的第一个索引]
  hi = items.length;
  let l = start;
  while (l < hi) {
    const mid = (l + hi) >> 1;
    if (offsets[mid] >= bottom) hi = mid;
    else l = mid + 1;
  }
  return [start, l];
}

/**
 * Patch the DOM to match the current window (and measure real heights) [按当前窗口修补 DOM 并测量真实高度]
 * @param force Re-render even if the index range is unchanged [索引区间未变也强制重渲染]
 */
function patch(force = false): void {
  rafId = 0;
  const noteList = document.getElementById('noteList');
  if (!noteList || !factories) return;

  const [start, end] = computeRange();
  if (!force && start === lastRange[0] && end === lastRange[1]) return;
  lastRange = [start, end];

  topSpacer.style.height = `${offsets[start]}px`;
  bottomSpacer.style.height = `${Math.max(0, totalHeight - offsets[end])}px`;

  const fragment = document.createDocumentFragment();
  const rendered: { item: VirtualItem; el: HTMLElement }[] = [];
  for (let i = start; i < end; i++) {
    const el = acquire(i);
    fragment.appendChild(el);
    rendered.push({ item: items[i], el });
  }
  noteList.replaceChildren(topSpacer, fragment, bottomSpacer);

  // Evict detached cache entries when too large [缓存过大时清理离屏元素]
  if (cardCache.size > 400) {
    for (const [key, el] of cardCache) {
      if (!el.isConnected) cardCache.delete(key);
    }
  }

  measure(rendered);
}

/**
 * Measure the real height of each rendered kind; if estimates were off, recompute
 * offsets and patch once more [测量各类条目的真实高度；若有偏差则重算偏移并再补丁一次]
 */
function measure(rendered: { item: VirtualItem; el: HTMLElement }[]): void {
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
    patch(true); // One extra pass with correct heights; measurement is now stable [用正确高度再补丁一次；此后测量稳定]
  }
}

// ==================== Public API [公开接口] ====================

/**
 * Render a flat item model into the virtual list [将展平的条目模型渲染进虚拟列表]
 * Clears the element cache (models are rebuilt only when data changed) [清空元素缓存 (模型仅在数据变化时重建)]
 */
export function renderVirtualNoteList(newItems: VirtualItem[], newFactories: VirtualFactories, opts?: VirtualRenderOptions): void {
  items = newItems;
  factories = newFactories;
  if (opts) activeNoteId = opts.activeNoteId ?? null;
  cardCache.clear();
  lastRange = [-1, -1];
  recomputeOffsets();
  patch();
}

/**
 * Update the active-note highlight without re-rendering [不重渲染地更新选中笔记高亮]
 * Updates both attached and cached card elements [同时更新已挂载与缓存中的卡片元素]
 */
export function syncActiveNoteInList(noteId: string | null): void {
  activeNoteId = noteId;
  document.querySelectorAll('#noteList .note-list-item').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-note-id') === noteId);
  });
  for (const el of cardCache.values()) {
    if (el.classList.contains('note-list-item')) {
      el.classList.toggle('active', el.getAttribute('data-note-id') === noteId);
    }
  }
}

/**
 * Get the current active note id tracked by the virtual list [获取虚拟列表跟踪的当前选中笔记]
 */
export function getActiveNoteId(): string | null {
  return activeNoteId;
}

/**
 * Note ids of all cards in the current model order (collapsed groups excluded by builders) [当前模型中全部卡片的笔记 id 顺序 (折叠分组已由构建方排除)]
 */
export function getVirtualCardNoteIds(): string[] {
  return items.filter(it => it.kind === 'card').map(it => (it as VirtualCardItem).note.id);
}

/**
 * Scroll the sidebar so the note's card is visible [滚动侧栏使笔记卡片可见]
 * No-op if the note is not in the current model [笔记不在当前模型中则不动作]
 */
export function scrollNoteIntoView(noteId: string): void {
  const idx = items.findIndex(it => it.kind === 'card' && it.note.id === noteId);
  if (idx === -1) return;
  const sidebar = getSidebar();
  if (!sidebar) return;
  const top = offsets[idx];
  const bottom = offsets[idx + 1];
  if (top < sidebar.scrollTop + 8) {
    sidebar.scrollTop = Math.max(0, top - 8);
  } else if (bottom > sidebar.scrollTop + sidebar.clientHeight - 8) {
    sidebar.scrollTop = Math.max(0, bottom - sidebar.clientHeight + 8);
  }
}

/**
 * Bind scroll/resize listeners (call once on init) [绑定滚动/缩放监听 (初始化时调用一次)]
 */
export function initVirtualList(): void {
  const sidebar = getSidebar();
  if (sidebar) sidebar.addEventListener('scroll', schedulePatch, { passive: true });
  window.addEventListener('resize', schedulePatch);
}

function schedulePatch(): void {
  if (!rafId) rafId = requestAnimationFrame(() => patch());
}
