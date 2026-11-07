// Note list sorting [笔记列表排序]

import type { NoteMeta } from 'sparklet/shared/types/notes';

/**
 * Sort notes: pinned > starred > updatedAt desc [排序：置顶 > 星标 > 更新时间降序]
 * Same rank used by listNotes and searchNotes [listNotes 与 searchNotes 共用同一排序]
 */
export function compareNotes(a: Partial<NoteMeta>, b: Partial<NoteMeta>): number {
  const aRank = (a.pinned ? 2 : 0) + (a.starred ? 1 : 0);
  const bRank = (b.pinned ? 2 : 0) + (b.starred ? 1 : 0);
  if (aRank !== bRank) return bRank - aRank;
  return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
}
