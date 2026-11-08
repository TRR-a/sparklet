// Code editor: public types [代码编辑器 - 对外类型]

/** Editor creation options [编辑器创建选项] */
export interface CodeEditorOptions {
  initialContent: string;
  /** Language id from getLanguageForFile, '' = plain [语言 ID，空串为纯文本] */
  language: string;
  /** Content-change notification (dirty) [内容变更通知 (脏状态)] */
  onChange?: () => void;
  /** Save shortcut notification (Ctrl/Cmd+S) [保存快捷键通知] */
  onSave?: () => void;
}

/** Editor instance handle [编辑器实例句柄] */
export interface CodeEditor {
  getValue(): string;
  focus(): void;
  destroy(): void;
}
