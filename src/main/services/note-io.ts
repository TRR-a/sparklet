// Note IO - atomic file writes for note storage [笔记 IO - 笔记存储的原子写入]
//
// Crash safety [崩溃安全]：
//   All note files are written via temp-file + rename. A crash mid-write leaves at
//   most a leftover *.tmp (cleaned by note-integrity at startup); the original
//   file is never partially overwritten [所有笔记文件经 临时文件+重命名 写入。
//   崩溃最多残留 *.tmp (启动时由 note-integrity 清理)，原文件不会被写一半]

import * as fs from 'fs-extra';

/** Retry delay for Windows EPERM/EACCES (AV / indexing may briefly lock files) [EPERM/EACCES 重试间隔 (杀毒/索引可能短暂锁文件)] */
const RETRY_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Whether an error is a transient Windows lock [是否为 Windows 短暂锁错误] */
function isLockError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException)?.code;
  return code === 'EPERM' || code === 'EACCES' || code === 'EBUSY';
}

/**
 * Write data to a temp file with retry on lock errors [写入临时文件 (锁错误时重试)]
 */
async function writeTmp(tmpPath: string, data: string, maxRetries: number): Promise<void> {
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
async function renameOnto(tmpPath: string, targetPath: string, maxRetries: number): Promise<void> {
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

/**
 * Atomically write a file: temp write + rename [原子写入文件：临时文件 + 重命名]
 * Either the old content or the new content survives a crash - never a partial mix
 * [崩溃后要么旧内容要么新内容 - 绝不会出现写了一半的混合状态]
 */
export async function writeFileAtomic(filePath: string, data: string, maxRetries: number = 3): Promise<void> {
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  try {
    await writeTmp(tmpPath, data, maxRetries);
    await renameOnto(tmpPath, filePath, maxRetries);
  } catch (err) {
    // Best-effort cleanup of the leftover temp file [尽力清理残留临时文件]
    try { await fs.remove(tmpPath); } catch { /* ignore [忽略] */ }
    throw err;
  }
}
