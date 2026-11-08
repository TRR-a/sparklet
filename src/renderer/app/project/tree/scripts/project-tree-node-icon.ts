// Project tree node: leading icon / toggle [项目树节点 - 行首图标与折叠箭头]

import type { ProjectFileNode } from 'sparklet/shared/types/project';
import { getFileIcon } from '../../scripts/project-file-icon.js';

/**
 * Append the toggle arrow and icon to the node row [向节点行追加折叠箭头与图标]
 * @param isExpanded Whether the directory is expanded [目录是否展开]
 */
export function appendNodeIcon(row: HTMLElement, node: ProjectFileNode, isExpanded: boolean): void {
  if (node.isDirectory) {
    const toggle = document.createElement('span');
    toggle.className = 'project-tree-toggle';
    toggle.textContent = isExpanded ? '▼' : '▶';
    row.appendChild(toggle);

    const icon = document.createElement('span');
    icon.className = 'project-tree-icon';
    icon.textContent = isExpanded ? '📂' : '📁';
    row.appendChild(icon);
  } else {
    const spacer = document.createElement('span');
    spacer.className = 'project-tree-toggle';
    spacer.textContent = '▶';
    spacer.style.visibility = 'hidden';
    row.appendChild(spacer);

    const icon = document.createElement('span');
    icon.className = 'project-tree-icon';
    icon.textContent = getFileIcon(node.name);
    row.appendChild(icon);
  }
}
