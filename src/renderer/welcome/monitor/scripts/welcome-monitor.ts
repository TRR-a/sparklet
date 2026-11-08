// Welcome system monitor card [欢迎页系统监控卡片]
//
// Split out [已拆分]：formatting/row helpers → monitor-format.ts,
// CPU+memory rows → monitor-rows.ts, disks → monitor-disks.ts, GPUs → monitor-gpus.ts.

import { systemApi } from 'sparklet/renderer/shared/index.js';
import type { SystemStats } from 'sparklet/shared/types/system.js';
import { updateCpuRow, updateMemoryRow } from 'sparklet/renderer/welcome/monitor/scripts/monitor-rows.js';
import { updateDiskRows } from 'sparklet/renderer/welcome/monitor/scripts/monitor-disks.js';
import { updateGpuRows } from 'sparklet/renderer/welcome/monitor/scripts/monitor-gpus.js';

// ========== System monitor [系统监控] ==========
const MONITOR_REFRESH_MS = 2000;

export function updateMonitor(stats: SystemStats): void {
  updateCpuRow(stats);
  updateMemoryRow(stats);
  updateDiskRows(stats);
  updateGpuRows(stats);
}

export async function refreshMonitor(): Promise<void> {
  try {
    const stats = await systemApi.stats();
    updateMonitor(stats);
  } catch (err) {
    console.warn('[Kernel] system stats failed:', err);
  }
}

/** Monitor refresh interval (ms) [监控刷新间隔 (毫秒)] */
export { MONITOR_REFRESH_MS };
