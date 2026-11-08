// Workspace: remove a project [工作区 - 移除项目]

import { workspaceProjects, expandedDirs, saveWorkspacePaths } from 'sparklet/renderer/app/project/workspace/scripts/project-workspace-state.js';

/**
 * Remove a project from the workspace (does not delete files) [从工作区移除项目 (不删除文件)]
 */
export function removeProjectFromWorkspace(projectPath: string): void {
  const index = workspaceProjects.findIndex(p => p.path === projectPath);
  if (index === -1) return;
  workspaceProjects.splice(index, 1);
  // Clean up expanded state for this project's paths [清理该项目路径的展开状态]
  for (const p of Array.from(expandedDirs)) {
    if (p.startsWith(projectPath)) expandedDirs.delete(p);
  }
  saveWorkspacePaths();
  // Late import for renderWorkspace [延迟导入 renderWorkspace]
  import('sparklet/renderer/app/project/tree/scripts/project-tree.js').then(({ renderWorkspace }) => renderWorkspace());
}
