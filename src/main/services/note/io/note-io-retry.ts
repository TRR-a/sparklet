// Note IO: lock-aware retry primitives [笔记 IO - 锁重试原语]

import * as fs from 'fs-extra';

/** Retry delay for Windows EPERM/EACCES (AV / indexing may briefly lock files) [EPERM/EACCES 重试间隔 (杀毒/索引可能短暂锁文件)] */
export const RETRY_DELAY_MS = 300;

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Whether an error is a transient Windows lock [是否为 Windows 短暂锁错误] */
export function isLockError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException)?.code;
  return code === 'EPERM' || code === 'EACCES' || code === 'EBUSY';
}

/**
 * Write data to a temp file with retry on lock errors [写入临时文件 (锁错误时重试)]
 */
export async function writeTmp(tmpPath: string, data: string, maxRetries: number): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fs.writeFile(tmpPath, data, 'utf8');
      return;
    } catch (err) {
      if (isLockError(err) && attempt < maxRetries) {
        console.warn(`[NoteIO] writeFile ${tmpPath} locked, retry ${attempt}/${maxRetries}...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
  }
}

/**
 * Rename temp file onto target with retry (target may be briefly locked) [重命名覆盖目标文件 (目标被短暂锁定时重试)]
 */
export async function renameOnto(tmpPath: string, targetPath: string, maxRetries: number): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fs.rename(tmpPath, targetPath);
      return;
    } catch (err) {
      if (isLockError(err) && attempt < maxRetries) {
        console.warn(`[NoteIO] rename ${targetPath} locked, retry ${attempt}/${maxRetries}...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
  }
}
