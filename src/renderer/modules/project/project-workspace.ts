// Project workspace - state, persistence, add/remove projects [项目工作区 - 状态、持久化、增删项目]

import type { ProjectFileNode } from '../../../shared/types/project';

/** localStorage key for persisted workspace paths [持久化工作区路径的 localStorage key] */
const WORKSPACE_STORAGE_KEY = 'sparklet:workspace:paths';

/** A single project in the workspace [工作区中的单个项目] */
export interface WorkspaceProject {
  path: string;
  name: string;
  root: ProjectFileNode;
  expanded: boolean;
}

/** All projects in the workspace [工作区中的所有项目] */
export const workspaceProjects: WorkspaceProject[] = [];

/** Set of expanded directory paths (global, absolute paths won't collide) [已展开目录路径集合 (全局，绝对路径不会冲突)] */
export const expandedDirs = new Set<string>();

/**
 * Persist workspace project paths to localStorage [将工作区项目路径持久化到 localStorage]
 */
export function saveWorkspacePaths(): void {
  try {
    const paths = workspaceProjects.map(p => p.path);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(paths));
  } catch {
    // Ignore storage errors (quota, private mode, etc.)
  }
}

/**
 * Restore workspace from localStorage (re-reads directory trees) [从 localStorage 恢复工作区 (重新读取目录树)]
 */
export async function restoreWorkspace(): Promise<void> {
  // Late import to avoid circular dependency [延迟导入以避免循环依赖]
  const { renderWorkspace } = await import('./project-tree.js');
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      renderWorkspace();
      return;
    }
    const paths: string[] = JSON.parse(raw);
    if (!Array.isArray(paths)) {
      renderWorkspace();
      return;
    }
    for (const projectPath of paths) {
      const treeResult = await window.projectAPI.readTree(projectPath);
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

/**
 * Open a folder and add it to the workspace [打开文件夹并添加到工作区]
 */
export async function openProjectFolder(): Promise<void> {
  const { renderWorkspace } = await import('./project-tree.js');
  const result = await window.projectAPI.openFolder();
  if (!result.success || result.canceled || !result.path) return;

  // Avoid duplicates [避免重复]
  if (workspaceProjects.some(p => p.path === result.path)) {
    renderWorkspace();
    return;
  }

  const treeResult = await window.projectAPI.readTree(result.path);
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
  import('./project-tree.js').then(({ renderWorkspace }) => renderWorkspace());
}

/**
 * Toggle a project's collapsed/expanded state [切换项目的折叠/展开状态]
 */
export function toggleProject(projectPath: string): void {
  const project = workspaceProjects.find(p => p.path === projectPath);
  if (!project) return;
  project.expanded = !project.expanded;
  // Late import for renderWorkspace [延迟导入 renderWorkspace]
  import('./project-tree.js').then(({ renderWorkspace }) => renderWorkspace());
}

/** Get workspace projects (for external use) [获取工作区项目 (供外部使用)] */
export function getWorkspaceProjects(): WorkspaceProject[] {
  return workspaceProjects;
}
