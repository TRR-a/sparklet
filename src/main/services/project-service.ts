// Project service - read directory tree [项目服务 - 读取目录树]

import * as fs from 'fs-extra';
import * as path from 'path';
import { dialog } from 'electron';
import type { ProjectFileNode, ProjectTreeResult, ProjectOpenResult } from '../../shared/types/project';

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
