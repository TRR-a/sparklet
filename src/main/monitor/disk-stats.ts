// Disk stats via platform commands [经平台命令采集磁盘状态]
//
// Split out [已拆分]：Windows enumeration → disk-stats-windows.ts,
// POSIX enumeration → disk-stats-posix.ts.

import type { DiskStats } from 'sparklet/shared/types/system.js';
import { readWindowsDisks } from 'sparklet/main/monitor/disk-stats-windows.js';
import { readPosixDisks } from 'sparklet/main/monitor/disk-stats-posix.js';

/** How long disk command results stay cached (ms) [磁盘命令结果缓存时长 (毫秒)] */
const SLOW_CACHE_TTL_MS = 5000;

let diskCache: DiskStats[] | null = null;
let diskCacheAt = 0;

/** Read local fixed disks (cached) [读取本地固定磁盘 (带缓存)] */
export async function readDisks(): Promise<DiskStats[]> {
  if (diskCache && Date.now() - diskCacheAt < SLOW_CACHE_TTL_MS) return diskCache;

  const disks = process.platform === 'win32'
    ? await readWindowsDisks()
    : await readPosixDisks();

  diskCache = disks;
  diskCacheAt = Date.now();
  return disks;
}
