// Project tree: project node header row [项目树 - 项目节点标题行]

import { toggleProject, removeProjectFromWorkspace } from '../../workspace/scripts/project-workspace.js';
import type { WorkspaceProject } from '../../workspace/scripts/project-workspace-state.js';

/** Build the header row of a project node (toggle / icon / name / remove) [构建项目节点标题行 (折叠/图标/名称/移除)] */
export function buildProjectHeader(project: WorkspaceProject): HTMLElement {
  // Header row [标题行]
  const header = document.createElement('div');
  header.className = 'project-root-header';

  const toggle = document.createElement('span');
  toggle.className = 'project-tree-toggle';
  toggle.textContent = project.expanded ? '▼' : '▶';
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleProject(project.path);
  });
  header.appendChild(toggle);

  const icon = document.createElement('span');
  icon.className = 'project-tree-icon';
  icon.textContent = '📂';
  header.appendChild(icon);

  const name = document.createElement('span');
  name.className = 'project-tree-name project-root-name';
  name.textContent = project.name;
  name.title = project.path;
  header.appendChild(name);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'project-remove-btn';
  removeBtn.textContent = '×';
  removeBtn.title = '从工作区移除';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeProjectFromWorkspace(project.path);
  });
  header.appendChild(removeBtn);

  header.addEventListener('click', () => toggleProject(project.path));
  return header;
}
