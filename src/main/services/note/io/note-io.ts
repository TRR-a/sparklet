// Note IO - atomic file writes for note storage [笔记 IO - 笔记存储的原子写入]
//
// Crash safety [崩溃安全]：
//   All note files are written via temp-file + rename. A crash mid-write leaves at
//   most a leftover *.tmp (cleaned by note-integrity at startup); the original
//   file is never partially overwritten [所有笔记文件经 临时文件+重命名 写入。
//   崩溃最多残留 *.tmp (启动时由 note-integrity 清理)，原文件不会被写一半]
//
// Lock-aware retry primitives in note-io-retry.ts [锁重试原语在 note-io-retry.ts]

import * as fs from 'fs-extra';
import { writeTmp, renameOnto } from './note-io-retry.js';

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
