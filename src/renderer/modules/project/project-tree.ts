// Project tree - workspace rendering and file tree nodes [项目树 - 工作区渲染和文件树节点]

import type { ProjectFileNode } from '../../../shared/types/project';
import {
  workspaceProjects,
  expandedDirs,
  toggleProject,
  removeProjectFromWorkspace,
} from './project-workspace.js';
import { projectApi } from './api/project-api.js';

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
    treeEl.appendChild(buildProjectNode(project));
  }
}

/**
 * Build a single project node (header + optional file tree) [构建单个项目节点 (标题 + 可选文件树)]
 */
function buildProjectNode(project: typeof workspaceProjects[0]): HTMLElement {
  const li = document.createElement('li');
  li.className = 'project-root-node';
  li.setAttribute('data-path', project.path);

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
  li.appendChild(header);

  // File tree (only if expanded) [文件树 (仅展开时)]
  if (project.expanded) {
    const childUl = document.createElement('ul');
    childUl.className = 'project-tree-children project-root-children';
    if (project.root.children) {
      for (const child of project.root.children) {
        childUl.appendChild(buildTreeNode(child, 1));
      }
    }
    li.appendChild(childUl);
  }

  return li;
}

/**
 * Build a single file tree node [构建单个文件树节点]
 */
function buildTreeNode(node: ProjectFileNode, depth: number): HTMLElement {
  const li = document.createElement('li');
  li.className = 'project-tree-node';
  li.setAttribute('data-path', node.path);

  const row = document.createElement('div');
  row.className = 'project-tree-row';

  if (node.isDirectory) {
    const toggle = document.createElement('span');
    toggle.className = 'project-tree-toggle';
    const isExpanded = expandedDirs.has(node.path);
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

  const name = document.createElement('span');
  name.className = 'project-tree-name';
  name.textContent = node.name;
  row.appendChild(name);

  // Click row: directory → toggle expand, file → preview [点击行：目录→展开/折叠，文件→预览]
  row.style.cursor = 'pointer';
  if (node.isDirectory) {
    row.addEventListener('click', () => {
      if (expandedDirs.has(node.path)) {
        expandedDirs.delete(node.path);
      } else {
        expandedDirs.add(node.path);
      }
      rerenderProjectContaining(node.path);
    });
  } else {
    row.addEventListener('click', () => {
      import('./project-preview.js').then(({ previewFile }) => previewFile(node.path, node.name));
    });
  }

  li.appendChild(row);

  // Render children if directory and expanded
  if (node.isDirectory && expandedDirs.has(node.path) && node.children) {
    const childUl = document.createElement('ul');
    childUl.className = 'project-tree-children';
    for (const child of node.children) {
      childUl.appendChild(buildTreeNode(child, depth + 1));
    }
    li.appendChild(childUl);
  }

  return li;
}

/**
 * Re-render the project that contains the given path [重新渲染包含给定路径的项目]
 * Refreshes that project's root from disk to get updated children [从磁盘刷新该项目的根以获取更新的子节点]
 */
async function rerenderProjectContaining(dirPath: string): Promise<void> {
  const project = workspaceProjects.find(p => dirPath.startsWith(p.path));
  if (!project) return;
  const result = await projectApi.readTree(project.path);
  if (result.success && result.root) {
    project.root = result.root;
    renderWorkspace();
  }
}

/**
 * Get icon emoji based on file extension [根据文件扩展名获取图标 emoji]
 */
export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    ts: '📘', tsx: '📘', js: '📒', jsx: '📒',
    py: '🐍', java: '☕', go: '🐹', rs: '🦀',
    c: 'C', cpp: 'C++', h: 'H',
    html: '🌐', css: '🎨', scss: '🎨',
    json: '📋', xml: '📋', yaml: '📋', yml: '📋',
    md: '📝', txt: '📄', pdf: '📕',
    doc: '📘', docx: '📘',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
    mp3: '🎵', wav: '🎵', mp4: '🎬', mov: '🎬',
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
  };
  return iconMap[ext] || '📄';
}
