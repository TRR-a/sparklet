// Disk stats: POSIX enumeration [磁盘状态 - POSIX 枚举]

import { run } from 'sparklet/main/monitor/system-command.js';
import type { DiskStats } from 'sparklet/shared/types/system.js';

/** Enumerate mounts via `df -Pk` [经 `df -Pk` 枚举挂载点] */
export async function readPosixDisks(): Promise<DiskStats[]> {
  const disks: DiskStats[] = [];
  // POSIX `df -Pk`: 1024-block columns, predictable layout [POSIX `df -Pk`：1024 块列，布局稳定]
  const out = await run('df', ['-Pk']);
  const lines = out.split('\n').slice(1);
  for (const line of lines) {
    const cols = line.trim().split(/\s+/);
    if (cols.length < 6) continue;
    const fs_ = cols[0];
    // Skip pseudo/virtual filesystems [跳过伪/虚拟文件系统]
    if (!fs_.startsWith('/') || fs_.startsWith('/dev/loop')) continue;
    const total = Number(cols[1]) * 1024;
    const used = Number(cols[2]) * 1024;
    const mount = cols[5];
    if (!Number.isFinite(total) || total <= 0) continue;
    disks.push({ mount, used, total, usage: total > 0 ? (used / total) * 100 : 0 });
  }
  return disks;
}
