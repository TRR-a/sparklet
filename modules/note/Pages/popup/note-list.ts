// Note list rendering - grouped list composition [笔记列表渲染 - 分组列表组装]
// Card element in note-card.ts, group helpers in note-group.ts, menus in note-menu.ts, info modal in note-info-modal.ts [卡片元素在 note-card.ts、分组辅助在 note-group.ts、菜单在 note-menu.ts、信息弹窗在 note-info-modal.ts]

import { t } from '../../Modules/i18n.js';
import { createGroupTitle, createGroupEmpty, applyGroup } from './note-group.js';
import { closeAllMenus } from './note-menu.js';
import { createNoteCard } from './note-card.js';

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
 * Render the note list [渲染笔记列表]
 * @param notes Note list data [笔记数据]
 * @param activeNoteId Currently active note ID for highlight (null = none) [当前选中笔记 ID 用于高亮 (null=无)]
 */
export async function renderNoteList(notes: NoteListItem[], activeNoteId: string | null = null): Promise<void> {
  const noteList = document.getElementById('noteList');
  if (!noteList) return;
  noteList.innerHTML = '';
  closeAllMenus();

  // Split into pinned, starred, and normal groups [分为置顶、星标、普通三组]
  const pinnedNotes = notes.filter(n => n.pinned);
  const starredNotes = notes.filter(n => !n.pinned && n.starred);
  const normalNotes = notes.filter(n => !n.pinned && !n.starred);

  // Pinned group [置顶分组]
  noteList.appendChild(createGroupTitle('pinned', t('noteList.groupPinned')));
  if (pinnedNotes.length > 0) {
    pinnedNotes.forEach(note => noteList.appendChild(applyGroup(createNoteCard(note, activeNoteId), 'pinned')));
  } else {
    noteList.appendChild(createGroupEmpty());
  }

  // Starred group [星标分组]
  noteList.appendChild(createGroupTitle('starred', t('noteList.groupStarred')));
  if (starredNotes.length > 0) {
    starredNotes.forEach(note => noteList.appendChild(applyGroup(createNoteCard(note, activeNoteId), 'starred')));
  } else {
    noteList.appendChild(createGroupEmpty());
  }

  // Recent group (non-pinned, non-starred) [最近分组 (未置顶未星标)]
  noteList.appendChild(createGroupTitle('recent', t('noteList.groupRecent')));
  if (normalNotes.length > 0) {
    normalNotes.forEach(note => noteList.appendChild(applyGroup(createNoteCard(note, activeNoteId), 'recent')));
  } else {
    noteList.appendChild(createGroupEmpty());
  }
}
