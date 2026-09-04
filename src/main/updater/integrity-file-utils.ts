// Integrity file utilities - directory scanning and combined hashing [完整性文件工具 - 目录扫描与组合哈希]

import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import { isExcludedFromIntegrity } from './constants';

/**
 * Recursively collect all files in a directory (excluding exact filename blacklist + extension blacklist) [递归收集目录下所有文件 (排除精确文件名黑名单 + 扩展名黑名单)]
 * Both generation side and runtime use isExcludedFromIntegrity for filtering, ensuring consistent rules [生成端和运行端统一用 isExcludedFromIntegrity 过滤，保证规则一致]
 */
export async function collectAllFiles(dir: string, fileList: string[]): Promise<void> {
  const items = await fs.readdir(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await collectAllFiles(fullPath, fileList);
    } else {
      // Dual filter by exact filename + extension (.log/.dmp/.tmp etc. excluded from hash) [精确文件名 + 扩展名双重过滤 (.log/.dmp/.tmp 等临时/崩溃文件一律不参与 hash)]
      if (isExcludedFromIntegrity(item)) {
        continue;
      }
      fileList.push(fullPath);
    }
  }
}

/**
 * Compute combined hash of multiple files (sort by path, concatenate content, then SHA256) [计算多个文件的组合哈希 (按路径排序后拼接内容，再算 SHA256)]
 */
export async function computeCombinedHash(filePaths: string[]): Promise<string> {
  const hash = crypto.createHash('sha256');
  const sorted = filePaths.slice().sort();
  for (const filePath of sorted) {
    const content = await fs.readFile(filePath);
    hash.update(content);
  }
  return hash.digest('hex');
}
