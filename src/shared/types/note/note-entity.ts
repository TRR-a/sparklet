// Note entity types [笔记实体类型]

/** Full note with content [含正文的完整笔记] */
export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  pinned: boolean;
  starred: boolean;
  /** User-assigned tags for filtering [用户分配的标签，用于筛选] */
  tags: string[];
}

/** Note metadata without content [不含正文的笔记元数据] */
export type NoteMeta = Omit<Note, 'content'>;
