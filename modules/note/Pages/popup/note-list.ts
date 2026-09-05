// Note list rendering - grouped list composition [笔记列表渲染 - 分组列表组装]
// Flattens notes into a VirtualItem[] and renders through the virtual list; card element
// in note-card.ts, group helpers in note-group.ts, menus in note-menu.ts [将笔记展平为
// VirtualItem[] 经虚拟列表渲染；卡片元素在 note-card.ts、分组辅助在 note-group.ts、菜单在 note-menu.ts]

import { t } from '../../Modules/i18n.js';
import { createGroupTitle, createGroupEmpty, collapsedGroups } from './note-group.js';
import { closeAllMenus } from './note-menu.js';
import { createNoteCard } from './note-card.js';
import {
  renderVirtualNoteList,
  getActiveNoteId,
  type VirtualItem,
  type VirtualFactories
} from './note-virtual-list.js';

/** Note list item data [笔记列表项数据] */
export interface NoteListItem {
  id: string;
  color: string;
  title: string;
  updatedAt: string;
  pinned?: boolean;
  starred?: boolean;
  deletedAt?: string | null;
}

/**
 * Factories shared by the main view and search results [主视图与搜索结果共用的元素工厂]
 * @param onRebuild Rebuild callback when a group is collapsed/expanded [分组折叠/展开时的重建回调]
 */
export function createMainViewFactories(onRebuild: () => void): VirtualFactories {
  return {
    createTitle: item => createGroupTitle(item.key, item.label, onRebuild),
    createEmpty: item => createGroupEmpty(item.label),
    createCard: (item, activeNoteId) => createNoteCard(item.note, activeNoteId),
  };
}

/**
 * Flatten one group into items (title + cards or empty, skipped cards when collapsed) [展平一个分组为条目 (标题 + 卡片或空占位，折叠时跳过卡片)]
 */
function pushGroup(items: VirtualItem[], key: string, label: string, group: NoteListItem[]): void {
  items.push({ kind: 'title', key, label });
  if (collapsedGroups.has(key)) return;
  if (group.length > 0) {
    group.forEach(note => items.push({ kind: 'card', note, variant: 'main' }));
  } else {
    items.push({ kind: 'empty' });
  }
}

/**
 * Render the note list [渲染笔记列表]
 * @param notes Note list data [笔记数据]
 * @param activeNoteId Currently active note ID for highlight (null = none) [当前选中笔记 ID 用于高亮 (null=无)]
 */
export async function renderNoteList(notes: NoteListItem[], activeNoteId: string | null = null): Promise<void> {
  if (!document.getElementById('noteList')) return;
  closeAllMenus();

  // Split into pinned, starred, and normal groups [分为置顶、星标、普通三组]
  const pinnedNotes = notes.filter(n => n.pinned);
  const starredNotes = notes.filter(n => !n.pinned && n.starred);
  const normalNotes = notes.filter(n => !n.pinned && !n.starred);

  const items: VirtualItem[] = [];
  pushGroup(items, 'pinned', t('noteList.groupPinned'), pinnedNotes);
  pushGroup(items, 'starred', t('noteList.groupStarred'), starredNotes);
  pushGroup(items, 'recent', t('noteList.groupRecent'), normalNotes);

  // Rebuild after collapse toggle with the latest active note [折叠切换后带最新选中笔记重建]
  const rebuild = () => { void renderNoteList(notes, getActiveNoteId()); };
  renderVirtualNoteList(items, createMainViewFactories(rebuild), { activeNoteId });
}
