// Project tree node: row click behavior [项目树节点 - 行点击行为]

import type { ProjectFileNode } from 'sparklet/shared/types/project.js';
import { expandedDirs } from 'sparklet/renderer/app/project/workspace/scripts/project-workspace.js';

/**
 * Bind row click: directory → toggle expand, file → preview [绑定行点击：目录→展开/折叠，文件→预览]
 * @param onDirToggle Called after a directory expands/collapses [目录展开/折叠后回调]
 */
export function bindNodeClick(
  row: HTMLElement,
  node: ProjectFileNode,
  onDirToggle: (dirPath: string) => void
): void {
  // Click row: directory → toggle expand, file → preview [点击行：目录→展开/折叠，文件→预览]
  row.style.cursor = 'pointer';
  if (node.isDirectory) {
    row.addEventListener('click', () => {
      if (expandedDirs.has(node.path)) {
        expandedDirs.delete(node.path);
      } else {
        expandedDirs.add(node.path);
      }
      onDirToggle(node.path);
    });
  } else {
    row.addEventListener('click', () => {
      import('sparklet/renderer/app/project/preview/scripts/project-preview.js').then(({ previewFile }) => previewFile(node.path, node.name));
    });
  }
}
