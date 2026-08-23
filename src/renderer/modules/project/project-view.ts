// Project view - workspace with multiple folders, remove from workspace [项目视图 - 多文件夹工作区，从工作区移除]

import type { ProjectFileNode } from '../../../shared/types/project';
import {
  EditorView,
  basicSetup,
  keymap,
  javascript,
  css,
  html,
  json,
  markdown,
  python,
  HighlightStyle,
  syntaxHighlighting,
  t,
} from '../../vendor/codemirror-vendor.bundle.js';
import type { Extension } from '@codemirror/state';

/** localStorage key for persisted workspace paths [持久化工作区路径的 localStorage key] */
const WORKSPACE_STORAGE_KEY = 'sparklet:workspace:paths';

/** A single project in the workspace [工作区中的单个项目] */
interface WorkspaceProject {
  path: string;
  name: string;
  root: ProjectFileNode;
  expanded: boolean;
}

/** All projects in the workspace [工作区中的所有项目] */
const workspaceProjects: WorkspaceProject[] = [];

/** Set of expanded directory paths (global, absolute paths won't collide) [已展开目录路径集合 (全局，绝对路径不会冲突)] */
const expandedDirs = new Set<string>();

/** Active CodeMirror editor view [当前 CodeMirror 编辑器实例] */
let editorView: EditorView | null = null;

/**
 * Persist workspace project paths to localStorage [将工作区项目路径持久化到 localStorage]
 */
function saveWorkspacePaths(): void {
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
  const result = await window.projectAPI.openFolder();
  if (!result.success || result.canceled || !result.path) return;

  // Avoid duplicates [避免重复]
  if (workspaceProjects.some(p => p.path === result.path)) {
    renderWorkspace();
    return;
  }

  const treeResult = await window.projectAPI.readTree(result.path);
  if (!treeResult.success || !treeResult.root) {
    // Still show error placeholder [仍显示错误占位]
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
  for (const path of Array.from(expandedDirs)) {
    if (path.startsWith(projectPath)) expandedDirs.delete(path);
  }
  saveWorkspacePaths();
  renderWorkspace();
}

/**
 * Toggle a project's collapsed/expanded state [切换项目的折叠/展开状态]
 */
function toggleProject(projectPath: string): void {
  const project = workspaceProjects.find(p => p.path === projectPath);
  if (!project) return;
  project.expanded = !project.expanded;
  renderWorkspace();
}

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
function buildProjectNode(project: WorkspaceProject): HTMLElement {
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
    row.addEventListener('click', () => previewFile(node.path, node.name));
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
  const result = await window.projectAPI.readTree(project.path);
  if (result.success && result.root) {
    project.root = result.root;
    renderWorkspace();
  }
}

/**
 * Get icon emoji based on file extension [根据文件扩展名获取图标 emoji]
 */
function getFileIcon(filename: string): string {
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

/**
 * Get CodeMirror language extension for a file name [根据文件名获取 CodeMirror 语言扩展]
 */
function getLanguageExtension(fileName: string): Extension | null {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'ts': case 'tsx': case 'js': case 'jsx': case 'mjs': case 'cjs':
      return javascript({ typescript: ext === 'ts' || ext === 'tsx', jsx: ext === 'tsx' || ext === 'jsx' });
    case 'css': case 'scss': case 'less':
      return css();
    case 'html': case 'htm': case 'svg': case 'xml':
      return html();
    case 'json': case 'jsonc':
      return json();
    case 'md': case 'markdown':
      return markdown();
    case 'py':
      return python();
    default:
      return null;
  }
}

/** Check if dark theme is active [检查是否暗色主题] */
function isDarkTheme(): boolean {
  return document.body.getAttribute('data-theme') === 'dark';
}

/**
 * Blue dark theme for CodeMirror (VS Code Dark+ inspired, transparent background)
 * [CodeMirror 蓝色暗色主题 (灵感来自 VS Code Dark+，透明背景)]
 */
const blueTheme = [
  EditorView.theme({
    '&': {
      backgroundColor: 'transparent !important',
      color: '#d4d4d4',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#569cd6',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#569cd6',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(38, 79, 120, 0.6) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent !important',
      color: '#6e7681',
      border: 'none',
      borderRight: '1px solid rgba(128, 128, 128, 0.15)',
    },
    '.cm-gutter': {
      backgroundColor: 'transparent !important',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      color: '#6e7681',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#569cd6',
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(86, 156, 214, 0.2)',
      outline: '1px solid rgba(86, 156, 214, 0.4)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(86, 156, 214, 0.3)',
      outline: '1px solid rgba(86, 156, 214, 0.5)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(86, 156, 214, 0.5)',
    },
    '.cm-tooltip': {
      backgroundColor: '#252526',
      border: '1px solid #3c3c3c',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: 'rgba(86, 156, 214, 0.2)',
        color: '#d4d4d4',
      },
    },
    '.cm-panels': {
      backgroundColor: '#252526',
      color: '#d4d4d4',
    },
    '.cm-panels input': {
      backgroundColor: '#3c3c3c',
      color: '#d4d4d4',
      border: '1px solid #3c3c3c',
    },
  }, { dark: true }),
  syntaxHighlighting(HighlightStyle.define([
    { tag: [t.keyword, t.operatorKeyword, t.modifier, t.controlKeyword, t.moduleKeyword], color: '#569cd6' },
    { tag: [t.definitionKeyword, t.namespace], color: '#c586c0' },
    { tag: [t.name, t.variableName], color: '#9cdcfe' },
    { tag: [t.function(t.variableName), t.labelName], color: '#dcdcaa' },
    { tag: [t.propertyName, t.attributeName], color: '#9cdcfe' },
    { tag: [t.typeName, t.className, t.tagName], color: '#4ec9b0' },
    { tag: [t.number, t.bool, t.null], color: '#b5cea8' },
    { tag: [t.string, t.docString, t.special(t.string)], color: '#ce9178' },
    { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#6a9955', fontStyle: 'italic' },
    { tag: [t.angleBracket, t.squareBracket, t.paren, t.brace], color: '#d4d4d4' },
    { tag: [t.operator, t.punctuation, t.separator], color: '#d4d4d4' },
    { tag: [t.regexp, t.escape], color: '#d16969' },
    { tag: [t.meta, t.annotation], color: '#dcdcaa' },
    { tag: [t.heading], color: '#569cd6', fontWeight: 'bold' },
    { tag: [t.quote], color: '#6a9955' },
    { tag: [t.link], color: '#569cd6' },
    { tag: [t.url], color: '#9cdcfe' },
    { tag: [t.atom, t.constant(t.name)], color: '#569cd6' },
    { tag: [t.standard(t.name)], color: '#4ec9b0' },
  ])),
];

/** Get workspace projects (for external use) [获取工作区项目 (供外部使用)] */
export function getWorkspaceProjects(): WorkspaceProject[] {
  return workspaceProjects;
}

/**
 * Preview a file in the right panel [在右侧面板打开文件]
 */
export async function previewFile(filePath: string, fileName: string): Promise<void> {
  const previewEl = document.getElementById('filePreview');
  const nameEl = document.getElementById('filePreviewName');
  const contentEl = document.getElementById('filePreviewContent');
  if (!previewEl || !nameEl || !contentEl) return;

  // Reset edit state [重置编辑状态]
  currentEditPath = null;
  currentEditName = null;
  isDirty = false;
  nameEl.textContent = fileName;
  nameEl.classList.remove('dirty');
  contentEl.innerHTML = '<div class="file-preview-loading">加载中...</div>';

  // Show preview, hide note editor [显示预览，隐藏笔记编辑器]
  showFilePreviewPanel(true);

  const result = await window.projectAPI.readFile(filePath);
  if (!result.success) {
    contentEl.innerHTML = `<div class="file-preview-error">无法打开: ${result.error || '未知错误'}</div>`;
    return;
  }

  if (result.isBinary) {
    const sizeKB = ((result.size || 0) / 1024).toFixed(1);
    contentEl.innerHTML = `<div class="file-preview-binary">二进制文件 (${sizeKB} KB)<br>不支持编辑</div>`;
    return;
  }

  if (result.isImage && !result.content) {
    // Raster image: use file:// URL [光栅图片：使用 file:// URL]
    const img = document.createElement('img');
    img.src = `file:///${filePath.replace(/\\/g, '/')}`;
    img.className = 'file-preview-image';
    img.alt = fileName;
    contentEl.innerHTML = '';
    contentEl.appendChild(img);
  } else if (result.content !== undefined) {
    // Text or SVG: CodeMirror editor [文本或 SVG：CodeMirror 编辑器]
    currentEditPath = filePath;
    currentEditName = fileName;

    // Destroy previous editor if any [销毁之前的编辑器]
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }

    contentEl.innerHTML = '';

    const extensions: Extension[] = [
      basicSetup,
      keymap.of([
        {
          key: 'Mod-s',
          run: () => {
            void saveCurrentFile();
            return true;
          },
        },
      ]),
      EditorView.updateListener.of(update => {
        if (update.docChanged && !isDirty) {
          isDirty = true;
          nameEl.classList.add('dirty');
        }
      }),
      EditorView.lineWrapping,
    ];

    // Language extension [语言扩展]
    const langExt = getLanguageExtension(fileName);
    if (langExt) extensions.push(langExt);

    // Blue dark theme [蓝色暗色主题]
    if (isDarkTheme()) extensions.push(...blueTheme);

    editorView = new EditorView({
      doc: result.content,
      extensions,
      parent: contentEl,
    });

    editorView.focus();
  } else {
    contentEl.innerHTML = '<div class="file-preview-error">不支持的文件类型</div>';
  }
}

/** Current editing file state [当前编辑文件状态] */
let currentEditPath: string | null = null;
let currentEditName: string | null = null;
let isDirty = false;

/**
 * Save the currently open file [保存当前打开的文件]
 */
export async function saveCurrentFile(): Promise<void> {
  if (!currentEditPath || !editorView) return;
  const nameEl = document.getElementById('filePreviewName');

  const content = editorView.state.doc.toString();
  const result = await window.projectAPI.writeFile(currentEditPath, content);
  if (result.success) {
    isDirty = false;
    nameEl?.classList.remove('dirty');
  } else {
    alert(`保存失败: ${result.error || '未知错误'}`);
  }
}

/**
 * Show or hide the file preview panel [显示或隐藏文件预览面板]
 */
function showFilePreviewPanel(show: boolean): void {
  const previewEl = document.getElementById('filePreview');
  const colorPalette = document.querySelector('.color-palette') as HTMLElement | null;
  const noteTitle = document.getElementById('noteTitle');
  const editorToolbar = document.querySelector('.editor-toolbar') as HTMLElement | null;
  const noteArea = document.getElementById('noteArea');
  const notePreview = document.getElementById('notePreview');

  if (previewEl) previewEl.style.display = show ? 'flex' : 'none';
  if (colorPalette) colorPalette.style.display = show ? 'none' : '';
  if (noteTitle) noteTitle.style.display = show ? 'none' : '';
  if (editorToolbar) editorToolbar.style.display = show ? 'none' : '';
  if (noteArea) noteArea.style.display = show ? 'none' : '';
  if (notePreview) notePreview.style.display = show ? 'none' : '';
}

/**
 * Close file preview and restore note editor [关闭文件预览并恢复笔记编辑器]
 */
export function closeFilePreview(): void {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
  currentEditPath = null;
  currentEditName = null;
  isDirty = false;
  const nameEl = document.getElementById('filePreviewName');
  nameEl?.classList.remove('dirty');
  showFilePreviewPanel(false);
}
