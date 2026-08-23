// Project service - read directory tree [项目服务 - 读取目录树]

import * as fs from 'fs-extra';
import * as path from 'path';
import { dialog } from 'electron';
import type { ProjectFileNode, ProjectTreeResult, ProjectOpenResult, ProjectFileReadResult, ProjectFileWriteResult } from '../../shared/types/project';

/** Image extensions [图片扩展名] */
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico']);

/** Binary file extensions (never preview as text) [二进制文件扩展名 (绝不作为文本预览)] */
const BINARY_EXTS = new Set([
  'dll', 'pak', 'exe', 'bin', 'so', 'dylib', 'class', 'pyc', 'pyo',
  'o', 'obj', 'lib', 'a', 'dll', 'sys', 'drv', 'efi',
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst',
  'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac',
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'wasm', 'node', 'dat', 'db', 'sqlite', 'sqlite3',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', // images handled separately but also binary
  'psd', 'ai', 'sketch', 'fig',
]);

/** Directories to skip when scanning [扫描时跳过的目录] */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build',
  '.next', '.nuxt', '.cache', '.vscode', '.idea',
  '__pycache__', '.venv', 'venv', 'env',
  'target', 'bin', 'obj',
]);

/** Max recursion depth [最大递归深度] */
const MAX_DEPTH = 8;

/**
 * Open a folder selection dialog [打开文件夹选择对话框]
 */
export async function openFolderDialog(): Promise<ProjectOpenResult> {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择项目文件夹',
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, canceled: true };
    }
    return { success: true, path: result.filePaths[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Read directory tree recursively [递归读取目录树]
 */
export async function readDirectoryTree(dirPath: string, depth = 0): Promise<ProjectTreeResult> {
  try {
    const root = await buildNode(dirPath, depth);
    return { success: true, root };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Build a single file tree node [构建单个文件树节点]
 */
async function buildNode(nodePath: string, depth: number): Promise<ProjectFileNode> {
  const stat = await fs.stat(nodePath);
  const name = path.basename(nodePath);
  const node: ProjectFileNode = {
    name,
    path: nodePath,
    isDirectory: stat.isDirectory(),
    size: stat.isFile() ? stat.size : undefined,
  };

  if (stat.isDirectory() && depth < MAX_DEPTH) {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(nodePath);
    } catch {
      // Permission denied or other error, return node without children
      node.children = [];
      return node;
    }

    // Filter out skipped dirs, sort: directories first, then files, alphabetically
    const dirs: string[] = [];
    const files: string[] = [];
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const fullPath = path.join(nodePath, entry);
      try {
        const entryStat = await fs.stat(fullPath);
        if (entryStat.isDirectory()) {
          dirs.push(entry);
        } else {
          files.push(entry);
        }
      } catch {
        // Skip inaccessible entries
      }
    }
    dirs.sort((a, b) => a.localeCompare(b));
    files.sort((a, b) => a.localeCompare(b));

    const children: ProjectFileNode[] = [];
    for (const dir of dirs) {
      children.push(await buildNode(path.join(nodePath, dir), depth + 1));
    }
    for (const file of files) {
      children.push(await buildNode(path.join(nodePath, file), depth + 1));
    }
    node.children = children;
  }

  return node;
}

/**
 * Read a file (text or image) [读取文件 (文本或图片)]
 */
export async function readFile(filePath: string): Promise<ProjectFileReadResult> {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return { success: false, error: 'Not a file' };
    }

    const ext = filePath.split('.').pop()?.toLowerCase() || '';

    // Binary files (not images) → don't read content [二进制文件 (非图片) → 不读内容]
    if (BINARY_EXTS.has(ext) && !IMAGE_EXTS.has(ext)) {
      return { success: true, isBinary: true, size: stat.size };
    }

    if (IMAGE_EXTS.has(ext)) {
      // For SVG, read as text; for other images, we'll use file:// URL in renderer
      if (ext === 'svg') {
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, content, isImage: true, size: stat.size };
      }
      // Non-SVG images: renderer will load via file:// path, no content needed
      return { success: true, isImage: true, size: stat.size };
    }

    const content = await fs.readFile(filePath, 'utf-8');
    // Fallback: detect binary by null bytes [兜底：通过 null 字节检测二进制]
    if (content.includes('\0')) {
      return { success: true, isBinary: true, size: stat.size };
    }
    return { success: true, content, size: stat.size };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Write text content to a file [写入文本内容到文件]
 */
export async function writeFile(filePath: string, content: string): Promise<ProjectFileWriteResult> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
