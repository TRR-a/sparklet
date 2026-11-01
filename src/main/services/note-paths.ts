// Note paths - shared path helpers for notes storage [笔记路径 - 笔记存储的共享路径工具]
// Extracted so notes-service / note-history / note-integrity share one source of truth
// without circular imports [抽出以便 notes-service / note-history / note-integrity 共用，避免循环依赖]

import * as path from 'path';
import * as fs from 'fs-extra';
import { app } from 'electron';

/**
 * Get notes directory path [获取笔记目录路径]
 */
export function getNotesDir(): string {
  return path.join(app.getPath('userData'), 'notes');
}

/**
 * Ensure notes directory exists [确保笔记目录存在]
 */
export async function ensureNotesDir(): Promise<string> {
  const dir = getNotesDir();
  await fs.ensureDir(dir);
  return dir;
}

/**
 * Get history directory for a note [获取某笔记的历史快照目录]
 */
export function getNoteHistoryDir(id: string): string {
  return path.join(getNotesDir(), '.history', id);
}

/**
 * Whether a value is a safe note id (alphanumeric / underscore / dash only)
 * [是否为安全的笔记 ID (仅字母数字/下划线/短横线)]
 * Prevents path traversal through IPC-supplied ids [防止经 IPC 传入的 id 造成路径穿越]
 */
export function isValidNoteId(id: string): boolean {
  return typeof id === 'string' && /^[A-Za-z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 100;
}

/**
 * Whether a value is a valid snapshot ts token (ms timestamp + 3-digit suffix)
 * [是否为合法的快照令牌 (毫秒时间戳 + 3 位随机后缀)]
 */
export function isValidSnapshotTs(ts: string): boolean {
  return typeof ts === 'string' && /^\d{13}-\d{3}$/.test(ts);
}
