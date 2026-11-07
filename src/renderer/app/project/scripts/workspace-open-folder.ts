// Workspace: open a folder and add it [工作区 - 打开文件夹并添加]

import { projectApi } from '../api/scripts/project-api.js';
import {
  workspaceProjects,
  expandedDirs,
  saveWorkspacePaths,
} from './project-workspace-state.js';

/**
 * Open a folder and add it to the workspace [打开文件夹并添加到工作区]
 */
export async function openProjectFolder(): Promise<void> {
  const { renderWorkspace } = await import('./project-tree.js');
  const result = await projectApi.openFolder();
  if (!result.success || result.canceled || !result.path) return;

  // Avoid duplicates [避免重复]
  if (workspaceProjects.some(p => p.path === result.path)) {
    renderWorkspace();
    return;
  }

  const treeResult = await projectApi.readTree(result.path);
  if (!treeResult.success || !treeResult.root) {
    workspaceProjects.push({
      path: result.path,
      name: result.path.split(/[\\/]/).pop() || result.path,
      root: { name: result.path, path: result.path, isDirectory: true, children: [] },
      expanded: true,
    });
    renderWorkspace();
    return;
  }

  // Auto-expand root directory of new project [新项目自动展开根目录]
  expandedDirs.add(result.path);

  workspaceProjects.push({
    path: result.path,
    name: treeResult.root.name,
    root: treeResult.root,
    expanded: true,
  });

  saveWorkspacePaths();
  renderWorkspace();
}
