// Project preview: editor/edit state [项目预览 - 编辑器与编辑状态]

import type { CodeEditor } from 'sparklet/renderer/app/project/editor/scripts/code-editor.js';

/** Active custom editor instance [当前自研编辑器实例] */
let editor: CodeEditor | null = null;

/** Current editing file state [当前编辑文件状态] */
let currentEditPath: string | null = null;
let currentEditName: string | null = null;
let isDirty = false;

export function getEditor(): CodeEditor | null { return editor; }
export function setEditor(v: CodeEditor | null): void { editor = v; }

export function getCurrentEditPath(): string | null { return currentEditPath; }
export function getCurrentEditName(): string | null { return currentEditName; }

export function setEditTarget(path: string | null, name: string | null): void {
  currentEditPath = path;
  currentEditName = name;
}

export function getIsDirty(): boolean { return isDirty; }
export function setIsDirty(v: boolean): void { isDirty = v; }
