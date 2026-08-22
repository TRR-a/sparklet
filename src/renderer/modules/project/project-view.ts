// Project view - open folder and display file tree [项目视图 - 打开文件夹并显示文件树]

import type { ProjectFileNode } from '../../../shared/types/project';

/** Currently opened project root path [当前打开的项目根路径] */
let currentRootPath: string | null = null;

/** Set of expanded directory paths [已展开的目录路径集合] */
const expandedDirs = new Set<string>();

/**
 * Open a folder and render its file tree [打开文件夹并渲染文件树]
 */
export async function openProjectFolder(): Promise<void> {
  const treeEl = document.getElementById('projectFileTree');
  const pathEl = document.getElementById('projectPath');
  if (!treeEl) return;

  const result = await window.projectAPI.openFolder();
  if (!result.success || result.canceled || !result.path) return;

  currentRootPath = result.path;
  if (pathEl) pathEl.textContent = result.path;

  const treeResult = await window.projectAPI.readTree(result.path);
  if (!treeResult.success || !treeResult.root) {
    treeEl.innerHTML = `<li class="project-error">${treeResult.error || 'Failed to read directory'}</li>`;
    return;
  }

  // Auto-expand root
  expandedDirs.add(result.path);
  renderFileTree(treeResult.root);
}

/**
 * Render the file tree into the container [将文件树渲染到容器中]
 */
export function renderFileTree(root: ProjectFileNode): void {
  const treeEl = document.getElementById('projectFileTree');
  if (!treeEl) return;
  treeEl.innerHTML = '';
  treeEl.appendChild(buildTreeNode(root, 0));
}

/**
 * Build a single tree node element [构建单个树节点元素]
 */
function buildTreeNode(node: ProjectFileNode, depth: number): HTMLElement {
  const li = document.createElement('li');
  li.className = 'project-tree-node';
  li.setAttribute('data-path', node.path);
  li.style.paddingLeft = `${depth * 16 + 8}px`;

  const row = document.createElement('div');
  row.className = 'project-tree-row';

  if (node.isDirectory) {
    const toggle = document.createElement('span');
    toggle.className = 'project-tree-toggle';
    const isExpanded = expandedDirs.has(node.path);
    toggle.textContent = isExpanded ? '▼' : '▶';
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (expandedDirs.has(node.path)) {
        expandedDirs.delete(node.path);
      } else {
        expandedDirs.add(node.path);
      }
      // Re-render from root
      if (currentRootPath) {
        window.projectAPI.readTree(currentRootPath).then(res => {
          if (res.success && res.root) renderFileTree(res.root);
        });
      }
    });
    row.appendChild(toggle);

    const icon = document.createElement('span');
    icon.className = 'project-tree-icon';
    icon.textContent = '📁';
    row.appendChild(icon);
  } else {
    const spacer = document.createElement('span');
    spacer.className = 'project-tree-toggle';
    spacer.textContent = '';
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
 * Get icon emoji based on file extension [根据文件扩展名获取图标 emoji]
 */
function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    // Code
    ts: '📘', tsx: '📘', js: '📒', jsx: '📒',
    py: '🐍', java: '☕', go: '🐹', rs: '🦀',
    c: 'C', cpp: 'C++', h: 'H',
    // Web
    html: '🌐', css: '🎨', scss: '🎨',
    json: '📋', xml: '📋', yaml: '📋', yml: '📋',
    // Docs
    md: '📝', txt: '📄', pdf: '📕',
    doc: '📘', docx: '📘',
    // Images
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
    // Audio/Video
    mp3: '🎵', wav: '🎵', mp4: '🎬', mov: '🎬',
    // Archives
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
  };
  return iconMap[ext] || '📄';
}

/** Get current project root path [获取当前项目根路径] */
export function getCurrentProjectPath(): string | null {
  return currentRootPath;
}
