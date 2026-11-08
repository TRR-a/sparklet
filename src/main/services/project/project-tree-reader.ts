// Project directory tree reader [项目目录树读取]
//
// Split out [已拆分]：skip list / depth → project-tree-skip.ts,
// node builder → project-tree-node-build.ts.

import type { ProjectTreeResult } from 'sparklet/shared/types/project';
import { buildNode } from './project-tree-node-build.js';

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
