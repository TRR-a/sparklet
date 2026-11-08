// Note list rendering - grouped list composition [笔记列表渲染 - 分组列表组装]
// Flattens notes into a VirtualItem[] and renders through the virtual list; card element
// in note-card.ts, group helpers in note-group.ts, menus in note-menu.ts [将笔记展平为
// VirtualItem[] 经虚拟列表渲染；卡片元素在 note-card.ts、分组辅助在 note-group.ts、菜单在 note-menu.ts]
//
// Split out [已拆分]：item type → note-list-types.ts, tag filter state → note-list-state.ts,
// tag bar → note-list-tag-filter.ts, groups/factories → note-list-groups.ts.

import { closeAllMenus } from 'sparklet/renderer/app/popup/note/scripts/note-menu.js';
import { renderVirtualNoteList, getActiveNoteId } from 'sparklet/renderer/app/popup/note/scripts/note-virtual-list.js';
import type { VirtualItem } from 'sparklet/renderer/app/popup/note/scripts/note-virtual-list.js';
import type { NoteListItem } from 'sparklet/renderer/app/popup/note/list/scripts/note-list-types.js';
import { getActiveTag } from 'sparklet/renderer/app/popup/note/list/scripts/note-list-state.js';
import { renderTagFilterBar } from 'sparklet/renderer/app/popup/note/list/scripts/note-list-tag-filter.js';
import {
  createMainViewFactories,
  pushGroup,
  splitNoteGroups,
  GROUP_LABELS,
} from 'sparklet/renderer/app/popup/note/list/scripts/note-list-groups.js';

export type { NoteListItem } from 'sparklet/renderer/app/popup/note/list/scripts/note-list-types.js';

/**
 * Render the note list [渲染笔记列表]
 * @param notes Note list data [笔记数据]
 * @param activeNoteId Currently active note ID for highlight (null = none) [当前选中笔记 ID 用于高亮 (null=无)]
 */
export async function renderNoteList(notes: NoteListItem[], activeNoteId: string | null = null): Promise<void> {
  if (!document.getElementById('noteList')) return;
  closeAllMenus();

  // Rebuild after collapse toggle with the latest active note [折叠切换后带最新选中笔记重建]
  const rebuild = () => { void renderNoteList(notes, getActiveNoteId()); };
  renderTagFilterBar(notes, rebuild);

  // Apply tag filter if one is selected [若选中标签则按标签过滤]
  const activeTag = getActiveTag();
  let visible = notes;
  if (activeTag) {
    visible = notes.filter(n => (n.tags || []).includes(activeTag));
  }

  const groups = splitNoteGroups(visible);
  const items: VirtualItem[] = [];
  pushGroup(items, 'pinned', GROUP_LABELS.pinned(), groups.pinned);
  pushGroup(items, 'starred', GROUP_LABELS.starred(), groups.starred);
  pushGroup(items, 'recent', GROUP_LABELS.recent(), groups.normal);

  renderVirtualNoteList(items, createMainViewFactories(rebuild), { activeNoteId });
}
