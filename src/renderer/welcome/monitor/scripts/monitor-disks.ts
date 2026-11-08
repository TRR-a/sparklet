// Welcome monitor: disk rows [欢迎页监控 - 磁盘行]

import type { SystemStats } from 'sparklet/shared/types/system.js';
import { formatBytes, ensureDynamicRow, paintFill } from './monitor-format.js';

/** Update dynamic disk rows [更新动态磁盘行] */
export function updateDiskRows(stats: SystemStats): void {
  // Disks
  const diskBox = document.getElementById('monitorDisks');
  if (diskBox) {
    stats.disks.forEach((disk) => {
      const row = ensureDynamicRow(diskBox, `disk-${disk.mount}`);
      const label = row.querySelector('.monitor-label');
      if (label) label.textContent = disk.mount;
      row.dataset.tooltip = `${disk.mount} · ${formatBytes(disk.used)} / ${formatBytes(disk.total)}`;
      paintFill(row, disk.usage);
      const value = row.querySelector('.monitor-value');
      if (value) value.textContent = `${disk.usage.toFixed(0)}% · ${formatBytes(disk.used)}/${formatBytes(disk.total)}`;
    });
  }
}
