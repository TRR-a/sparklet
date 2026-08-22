// Note data types [笔记数据类型]

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
}

/** Note metadata without content [不含正文的笔记元数据] */
export type NoteMeta = Omit<Note, 'content'>;

/** Result of listing notes [笔记列表结果] */
export interface NoteListResult {
  success: boolean;
  notes?: NoteMeta[];
  error?: string;
}

/** Result of getting a single note [获取单篇笔记结果] */
export interface NoteGetResult {
  success: boolean;
  note?: Note;
  error?: string;
}

/** Result of saving a note [保存笔记结果] */
export interface NoteSaveResult {
  success: boolean;
  note?: Note;
  error?: string;
}

/** Result of note operations (delete/restore/permanentDelete) [笔记操作结果 (删除/恢复/永久删除)] */
export interface NoteOperationResult {
  success: boolean;
  error?: string;
}
