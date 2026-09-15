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
  tags?: string[];
  deletedAt?: string | null;
}

/** Currently selected tag filter ('' = show all) [当前选中的标签筛选 (空 = 全部)] */
let activeTag = '';

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
 * Render the tag filter bar: "All" + every tag that exists, click to filter
 * [渲染标签筛选条：全部 + 所有出现过的标签，点击筛选]
 */
function renderTagFilterBar(notes: NoteListItem[]): void {
  const bar = document.getElementById('tagFilterBar');
  if (!bar) return;
  const tagSet = new Set<string>();
  notes.forEach(n => (n.tags || []).forEach(tag => tagSet.add(tag)));
  const allTags = Array.from(tagSet).sort();
  if (allTags.length === 0) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }
  bar.style.display = 'flex';
  const chips: string[] = [`<span class="tag-chip${activeTag === '' ? ' active' : ''}" data-tag="">${t('tagFilter.all')}</span>`];
  allTags.forEach(tag => {
    chips.push(`<span class="tag-chip${activeTag === tag ? ' active' : ''}" data-tag="${tag}">${tag}</span>`);
  });
  bar.innerHTML = chips.join('');
  bar.querySelectorAll<HTMLElement>('.tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeTag = chip.dataset.tag || '';
      void renderNoteList(notes, getActiveNoteId());
    });
  });
}

/**
 * Render the note list [渲染笔记列表]
 * @param notes Note list data [笔记数据]
 * @param activeNoteId Currently active note ID for highlight (null = none) [当前选中笔记 ID 用于高亮 (null=无)]
 */
export async function renderNoteList(notes: NoteListItem[], activeNoteId: string | null = null): Promise<void> {
  if (!document.getElementById('noteList')) return;
  closeAllMenus();

  renderTagFilterBar(notes);

  // Apply tag filter if one is selected [若选中标签则按标签过滤]
  let visible = notes;
  if (activeTag) {
    visible = notes.filter(n => (n.tags || []).includes(activeTag));
  }

  // Split into pinned, starred, and normal groups [分为置顶、星标、普通三组]
  const pinnedNotes = visible.filter(n => n.pinned);
  const starredNotes = visible.filter(n => !n.pinned && n.starred);
  const normalNotes = visible.filter(n => !n.pinned && !n.starred);

  const items: VirtualItem[] = [];
  pushGroup(items, 'pinned', t('noteList.groupPinned'), pinnedNotes);
  pushGroup(items, 'starred', t('noteList.groupStarred'), starredNotes);
  pushGroup(items, 'recent', t('noteList.groupRecent'), normalNotes);

  // Rebuild after collapse toggle with the latest active note [折叠切换后带最新选中笔记重建]
  const rebuild = () => { void renderNoteList(notes, getActiveNoteId()); };
  renderVirtualNoteList(items, createMainViewFactories(rebuild), { activeNoteId });
}
