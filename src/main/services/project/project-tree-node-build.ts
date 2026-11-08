// Project tree reader: node builder [项目树读取 - 节点构建]
//
// Split out [已拆分]：directory listing → project-tree-entries.ts.

import * as fs from 'fs-extra';
import * as path from 'path';
import type { ProjectFileNode } from 'sparklet/shared/types/project';
import { MAX_DEPTH } from './project-tree-skip.js';
import { listSortedEntries } from './project-tree-entries.js';

/**
 * Build a single file tree node [构建单个文件树节点]
 */
export async function buildNode(nodePath: string, depth: number): Promise<ProjectFileNode> {
  const stat = await fs.stat(nodePath);
  const name = path.basename(nodePath);
  const node: ProjectFileNode = {
    name,
    path: nodePath,
    isDirectory: stat.isDirectory(),
    size: stat.isFile() ? stat.size : undefined,
  };

  if (stat.isDirectory() && depth < MAX_DEPTH) {
    const { dirs, files } = await listSortedEntries(nodePath);

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
