// Project workspace - entry barrel [项目工作区 - 入口]
// State in project-workspace-state.ts, operations in project-workspace-io.ts
// [状态在 project-workspace-state.ts，操作在 project-workspace-io.ts]

export type { WorkspaceProject } from 'sparklet/renderer/app/project/workspace/scripts/project-workspace-state.js';
export {
  workspaceProjects,
  expandedDirs,
  saveWorkspacePaths,
  getWorkspaceProjects,
} from 'sparklet/renderer/app/project/workspace/scripts/project-workspace-state.js';
export {
  restoreWorkspace,
  openProjectFolder,
  removeProjectFromWorkspace,
  toggleProject,
} from 'sparklet/renderer/app/project/workspace/scripts/project-workspace-io.js';
