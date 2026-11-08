// Note list: group flattening + factories [笔记列表 - 分组展平与工厂]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { createGroupTitle, createGroupEmpty, collapsedGroups } from '../../scripts/note-group.js';
import { createNoteCard } from '../../card/scripts/note-card.js';
import type { VirtualItem, VirtualFactories } from '../../scripts/note-virtual-list.js';
import type { NoteListItem } from './note-list-types.js';

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
export function pushGroup(items: VirtualItem[], key: string, label: string, group: NoteListItem[]): void {
  items.push({ kind: 'title', key, label });
  if (collapsedGroups.has(key)) return;
  if (group.length > 0) {
    group.forEach(note => items.push({ kind: 'card', note, variant: 'main' }));
  } else {
    items.push({ kind: 'empty' });
  }
}

/** Split visible notes into pinned / starred / normal groups [把可见笔记分为置顶/星标/普通三组] */
export function splitNoteGroups(visible: NoteListItem[]): {
  pinned: NoteListItem[];
  starred: NoteListItem[];
  normal: NoteListItem[];
} {
  return {
    pinned: visible.filter(n => n.pinned),
    starred: visible.filter(n => !n.pinned && n.starred),
    normal: visible.filter(n => !n.pinned && !n.starred),
  };
}

/** Group label keys used in the flattened list [展平列表使用的分组标题 i18n 键] */
export const GROUP_LABELS = {
  pinned: () => t('noteList.groupPinned'),
  starred: () => t('noteList.groupStarred'),
  recent: () => t('noteList.groupRecent'),
};
