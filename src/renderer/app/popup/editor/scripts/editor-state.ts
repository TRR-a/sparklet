// Editor state: preview mode & current note [编辑器状态 - 预览模式与当前笔记]

/** Preview mode state [预览模式状态] */
let isPreviewMode = false;

/** Current active note ID [当前选中的笔记 ID] */
let currentNoteId: string | null = null;

/** Set current note ID (for trash module access) [设置当前笔记 ID (供回收站模块访问)] */
export function setCurrentNoteId(id: string | null): void {
  currentNoteId = id;
}

/** Get current note ID [获取当前笔记 ID] */
export function getCurrentNoteId(): string | null {
  return currentNoteId;
}

/** Set preview mode state [设置预览模式状态] */
export function setPreviewMode(value: boolean): void {
  isPreviewMode = value;
}

/** Get preview mode state [获取预览模式状态] */
export function getPreviewMode(): boolean {
  return isPreviewMode;
}
