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
} from './project-workspace.js';

export type { WorkspaceProject } from './project-workspace.js';

export {
  renderWorkspace,
  getFileIcon,
} from './project-tree.js';

export {
  previewFile,
  saveCurrentFile,
  closeFilePreview,
} from './project-preview.js';

export {
  createCodeEditor,
} from './code-editor.js';
export type { CodeEditor, CodeEditorOptions } from './code-editor.js';
