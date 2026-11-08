// Project view - entry point, re-exports all project modules [项目视图 - 入口文件，re-export 所有项目模块]

export {
  workspaceProjects,
  expandedDirs,
  saveWorkspacePaths,
  restoreWorkspace,
  openProjectFolder,
  removeProjectFromWorkspace,
  toggleProject,
  getWorkspaceProjects,
} from 'sparklet/renderer/app/project/workspace/scripts/project-workspace.js';

export type { WorkspaceProject } from 'sparklet/renderer/app/project/workspace/scripts/project-workspace.js';

export {
  renderWorkspace,
  getFileIcon,
} from 'sparklet/renderer/app/project/tree/scripts/project-tree.js';

export {
  previewFile,
  saveCurrentFile,
  closeFilePreview,
} from 'sparklet/renderer/app/project/preview/scripts/project-preview.js';

export {
  createCodeEditor,
} from 'sparklet/renderer/app/project/editor/scripts/code-editor.js';
export type { CodeEditor, CodeEditorOptions } from 'sparklet/renderer/app/project/editor/scripts/code-editor.js';
