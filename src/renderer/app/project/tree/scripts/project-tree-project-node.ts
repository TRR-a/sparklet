// Project tree: single project node (header + optional children) [项目树 - 单个项目节点 (标题 + 可选文件树)]
//
// Split out [已拆分]：header row → project-tree-project-header.ts.

import { buildTreeNode } from 'sparklet/renderer/app/project/tree/scripts/project-tree-node.js';
import { buildProjectHeader } from 'sparklet/renderer/app/project/tree/scripts/project-tree-project-header.js';
import type { WorkspaceProject } from 'sparklet/renderer/app/project/workspace/scripts/project-workspace-state.js';

/**
 * Build a single project node (header + optional file tree) [构建单个项目节点 (标题 + 可选文件树)]
 */
export function buildProjectNode(
  project: WorkspaceProject,
  onRefresh: (path: string) => void
): HTMLElement {
  const li = document.createElement('li');
  li.className = 'project-root-node';
  li.setAttribute('data-path', project.path);

  li.appendChild(buildProjectHeader(project));

  // File tree (only if expanded) [文件树 (仅展开时)]
  if (project.expanded) {
    const childUl = document.createElement('ul');
    childUl.className = 'project-tree-children project-root-children';
    if (project.root.children) {
      for (const child of project.root.children) {
        childUl.appendChild(buildTreeNode(child, 1, onRefresh));
      }
    }
    li.appendChild(childUl);
  }

  return li;
}
