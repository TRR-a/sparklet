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
} from '../workspace/scripts/project-workspace.js';

export type { WorkspaceProject } from '../workspace/scripts/project-workspace.js';

export {
  renderWorkspace,
  getFileIcon,
} from '../tree/scripts/project-tree.js';

export {
  previewFile,
  saveCurrentFile,
  closeFilePreview,
} from '../preview/scripts/project-preview.js';

export {
  createCodeEditor,
} from '../editor/scripts/code-editor.js';
export type { CodeEditor, CodeEditorOptions } from '../editor/scripts/code-editor.js';
