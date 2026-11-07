// Trash view: list rendering [回收站视图 - 列表渲染]

import storageManager from 'sparklet/renderer/shared/storage/storage-manager.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { createGroupTitle, createGroupEmpty, collapsedGroups } from '../../note/scripts/note-group.js';
import { closeAllMenus } from '../../note/scripts/note-menu.js';
import { renderVirtualNoteList, type VirtualItem } from '../../note/scripts/note-virtual-list.js';
import type { NoteListItem } from '../../note/scripts/note-list.js';
import { createTrashCard } from './trash-card.js';

/**
 * Render trash list, grouped into starred / others (both collapsible) [渲染回收站列表，分为星标/其他两组 (均可折叠)]
 */
export async function renderTrashList(): Promise<void> {
  if (!document.getElementById('noteList')) return;
  closeAllMenus();
  const trashedNotes = await storageManager.getTrashNotes();

  // Split starred trashed notes from the rest [拆分星标删除笔记与其余笔记]
  const starredNotes = trashedNotes.filter(note => note.starred);
  const otherNotes = trashedNotes.filter(note => !note.starred);

  const items: VirtualItem[] = [];
  const pushGroup = (key: string, label: string, group: NoteListItem[]) => {
    items.push({ kind: 'title', key, label });
    if (collapsedGroups.has(key)) return;
    if (group.length > 0) {
      group.forEach(note => items.push({ kind: 'card', note, variant: 'trash' }));
    } else {
      items.push({ kind: 'empty' });
    }
  };
  pushGroup('trash-starred', t('noteList.groupStarred'), starredNotes);
  pushGroup('trash-others', t('noteList.groupOthers'), otherNotes);

  renderVirtualNoteList(items, {
    createTitle: item => createGroupTitle(item.key, item.label, () => void renderTrashList()),
    createEmpty: item => createGroupEmpty(item.label),
    createCard: item => createTrashCard(item.note),
  }, { activeNoteId: null });
}
