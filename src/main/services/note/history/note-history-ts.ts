// Note history: snapshot tokens & in-session bookkeeping [笔记历史 - 快照令牌与会话内记录]

import * as fs from 'fs-extra';
import { getNoteHistoryDir, isValidSnapshotTs } from '../io/note-paths.js';

/** Minimum interval between snapshots of the same note [同一笔记两次快照的最小间隔] */
export const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000;

/** Max snapshots kept per note [每笔记保留的快照上限] */
export const MAX_SNAPSHOTS_PER_NOTE = 20;

/** In-memory last snapshot time per note (session-scoped) [每笔记最近快照时间 (会话级)] */
export const lastSnapshotAt = new Map<string, number>();

/**
 * Generate a snapshot ts token: ms timestamp + 3-digit random suffix
 * [生成快照令牌：毫秒时间戳 + 3 位随机后缀 (文件名安全且可按名称排序)]
 */
export function makeTsToken(): string {
  return `${Date.now()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
}

/**
 * List snapshot files of a note, newest first (by ts token, ms-prefixed names sort naturally)
 * [列出某笔记的快照文件，按令牌降序 (毫秒前缀文件名天然可排序)]
 */
export async function listSnapshotTs(id: string): Promise<string[]> {
  const dir = getNoteHistoryDir(id);
  if (!(await fs.pathExists(dir))) return [];
  const files = await fs.readdir(dir);
  return files
    .filter(f => f.endsWith('.json') && isValidSnapshotTs(f.replace('.json', '')))
    .map(f => f.replace('.json', ''))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}
