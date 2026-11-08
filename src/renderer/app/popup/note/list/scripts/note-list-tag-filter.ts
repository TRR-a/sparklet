// Note list: tag filter bar [笔记列表 - 标签筛选条]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import type { NoteListItem } from 'sparklet/renderer/app/popup/note/list/scripts/note-list-types.js';
import { getActiveTag, setActiveTag } from 'sparklet/renderer/app/popup/note/list/scripts/note-list-state.js';

/**
 * Render the tag filter bar: "All" + every tag that exists, click to filter
 * [渲染标签筛选条：全部 + 所有出现过的标签，点击筛选]
 * @param notes Note list data [笔记数据]
 * @param onFilterChange Re-render callback after the filter changed [筛选变化后的重渲染回调]
 */
export function renderTagFilterBar(notes: NoteListItem[], onFilterChange: () => void): void {
  const bar = document.getElementById('tagFilterBar');
  if (!bar) return;
  const activeTag = getActiveTag();
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
      setActiveTag(chip.dataset.tag || '');
      onFilterChange();
    });
  });
}
