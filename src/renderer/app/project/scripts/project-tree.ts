// Project tree - workspace rendering and project nodes [项目树 - 工作区渲染和项目节点]
// File nodes in project-tree-node.ts, icons in project-file-icon.ts,
// single project node in project-tree-project-node.ts, disk refresh in project-tree-refresh.ts
// [文件节点在 project-tree-node.ts，图标在 project-file-icon.ts，
//  单个项目节点在 project-tree-project-node.ts，磁盘刷新在 project-tree-refresh.ts]

import { workspaceProjects } from './project-workspace.js';
import { buildProjectNode } from './project-tree-project-node.js';
import { rerenderProjectContaining } from './project-tree-refresh.js';

export { getFileIcon } from './project-file-icon.js';

/**
 * Render the entire workspace [渲染整个工作区]
 */
export function renderWorkspace(): void {
  const treeEl = document.getElementById('projectFileTree');
  if (!treeEl) return;
  treeEl.innerHTML = '';

  if (workspaceProjects.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'note-group-empty';
    empty.textContent = '- 无 -';
    treeEl.appendChild(empty);
    return;
  }

  for (const project of workspaceProjects) {
    treeEl.appendChild(buildProjectNode(project, (path) => { void rerenderProjectContaining(path); }));
  }
}
