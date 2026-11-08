// Workspace: toggle a project's expanded state [工作区 - 切换项目展开状态]

import { workspaceProjects } from 'sparklet/renderer/app/project/workspace/scripts/project-workspace-state.js';

/**
 * Toggle a project's collapsed/expanded state [切换项目的折叠/展开状态]
 */
export function toggleProject(projectPath: string): void {
  const project = workspaceProjects.find(p => p.path === projectPath);
  if (!project) return;
  project.expanded = !project.expanded;
  // Late import for renderWorkspace [延迟导入 renderWorkspace]
  import('sparklet/renderer/app/project/tree/scripts/project-tree.js').then(({ renderWorkspace }) => renderWorkspace());
}
