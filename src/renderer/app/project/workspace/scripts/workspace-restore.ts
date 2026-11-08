// Workspace: restore from localStorage [工作区 - 从 localStorage 恢复]

import { projectApi } from 'sparklet/renderer/app/project/api/scripts/project-api.js';
import { workspaceProjects, expandedDirs, readWorkspacePaths } from 'sparklet/renderer/app/project/workspace/scripts/project-workspace-state.js';

/**
 * Restore workspace from localStorage (re-reads directory trees) [从 localStorage 恢复工作区 (重新读取目录树)]
 */
export async function restoreWorkspace(): Promise<void> {
  // Late import to avoid circular dependency [延迟导入以避免循环依赖]
  const { renderWorkspace } = await import('sparklet/renderer/app/project/tree/scripts/project-tree.js');
  const paths = readWorkspacePaths();
  if (!paths) {
    renderWorkspace();
    return;
  }
  try {
    for (const projectPath of paths) {
      const treeResult = await projectApi.readTree(projectPath);
      if (!treeResult.success || !treeResult.root) continue;
      expandedDirs.add(projectPath);
      workspaceProjects.push({
        path: projectPath,
        name: treeResult.root.name,
        root: treeResult.root,
        expanded: true,
      });
    }
  } catch {
    // Ignore parse errors
  }
  renderWorkspace();
}
