// Project tree node rendering [项目树节点渲染]
// Leading icon in project-tree-node-icon.ts, click behavior in project-tree-node-click.ts
// [行首图标在 project-tree-node-icon.ts，点击行为在 project-tree-node-click.ts]

import type { ProjectFileNode } from 'sparklet/shared/types/project';
import { expandedDirs } from './project-workspace.js';
import { appendNodeIcon } from './project-tree-node-icon.js';
import { bindNodeClick } from './project-tree-node-click.js';

/**
 * Build a single file tree node [构建单个文件树节点]
 * @param onDirToggle Called after a directory expands/collapses [目录展开/折叠后回调]
 */
export function buildTreeNode(
  node: ProjectFileNode,
  depth: number,
  onDirToggle: (dirPath: string) => void
): HTMLElement {
  const li = document.createElement('li');
  li.className = 'project-tree-node';
  li.setAttribute('data-path', node.path);

  const row = document.createElement('div');
  row.className = 'project-tree-row';

  if (node.isDirectory) {
    appendNodeIcon(row, node, expandedDirs.has(node.path));
  } else {
    appendNodeIcon(row, node, false);
  }

  const name = document.createElement('span');
  name.className = 'project-tree-name';
  name.textContent = node.name;
  row.appendChild(name);

  bindNodeClick(row, node, onDirToggle);

  li.appendChild(row);

  // Render children if directory and expanded
  if (node.isDirectory && expandedDirs.has(node.path) && node.children) {
    const childUl = document.createElement('ul');
    childUl.className = 'project-tree-children';
    for (const child of node.children) {
      childUl.appendChild(buildTreeNode(child, depth + 1, onDirToggle));
    }
    li.appendChild(childUl);
  }

  return li;
}
