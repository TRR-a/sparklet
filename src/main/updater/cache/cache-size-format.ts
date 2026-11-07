// Cache info: file size + byte formatting [缓存信息 - 文件大小与字节格式化]

import * as fs from 'fs-extra';

/**
 * Get file size of a single ZIP in directory (bytes) [计算目录下单个 ZIP 的大小 (字节)]
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stat = await fs.stat(filePath);
    return stat.size || 0;
  } catch {
    return 0;
  }
}

/**
 * Format bytes to human-readable string [格式化字节数为可读字符串]
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}
