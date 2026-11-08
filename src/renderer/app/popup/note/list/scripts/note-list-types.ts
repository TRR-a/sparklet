// Note list: item data type [笔记列表 - 条目数据类型]

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
