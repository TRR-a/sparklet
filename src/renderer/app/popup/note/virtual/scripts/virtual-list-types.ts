// Virtual list types [虚拟列表类型]

import type { NoteListItem } from 'sparklet/renderer/app/popup/note/list/scripts/note-list.js';

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
