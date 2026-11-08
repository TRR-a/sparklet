// Project workspace state & persistence [项目工作区状态与持久化]

import type { ProjectFileNode } from 'sparklet/shared/types/project.js';

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

/** Read persisted workspace paths (null when absent/invalid) [读取持久化的工作区路径 (缺失或无效时为 null)] */
export function readWorkspacePaths(): string[] | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const paths: unknown = JSON.parse(raw);
    return Array.isArray(paths) ? (paths as string[]) : null;
  } catch {
    return null;
  }
}

/** Get workspace projects (for external use) [获取工作区项目 (供外部使用)] */
export function getWorkspaceProjects(): WorkspaceProject[] {
  return workspaceProjects;
}
