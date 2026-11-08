// Project tree: refresh a project from disk [项目树 - 从磁盘刷新项目]

import { projectApi } from 'sparklet/renderer/app/project/api/scripts/project-api.js';
import { workspaceProjects } from 'sparklet/renderer/app/project/workspace/scripts/project-workspace-state.js';

/**
 * Re-render the project that contains the given path [重新渲染包含给定路径的项目]
 * Refreshes that project's root from disk to get updated children [从磁盘刷新该项目的根以获取更新的子节点]
 */
export async function rerenderProjectContaining(dirPath: string): Promise<void> {
  const project = workspaceProjects.find(p => dirPath.startsWith(p.path));
  if (!project) return;
  const result = await projectApi.readTree(project.path);
  if (result.success && result.root) {
    project.root = result.root;
    const { renderWorkspace } = await import('sparklet/renderer/app/project/tree/scripts/project-tree.js');
    renderWorkspace();
  }
}
