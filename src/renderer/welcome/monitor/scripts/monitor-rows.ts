// Welcome monitor: CPU & memory rows [欢迎页监控 - CPU 与内存行]

import type { SystemStats } from 'sparklet/shared/types/system.js';
import { getLang } from '../../i18n/scripts/welcome-i18n.js';
import { formatBytes, paintFill } from './monitor-format.js';

/** Update the static CPU row [更新固定 CPU 行] */
export function updateCpuRow(stats: SystemStats): void {
  // CPU
  const cpuRow = document.getElementById('monitorCpu');
  if (cpuRow) {
    const label = cpuRow.querySelector('.monitor-label');
    if (label) label.textContent = 'CPU';
    cpuRow.dataset.tooltip = `${stats.cpu.model} · ${stats.cpu.cores} ${getLang() === 'zh-CN' ? '线程' : 'threads'}`;
    paintFill(cpuRow, stats.cpu.usage);
    const value = cpuRow.querySelector('.monitor-value');
    if (value) value.textContent = `${stats.cpu.usage.toFixed(0)}%`;
  }
}

/** Update the static memory row [更新固定内存行] */
export function updateMemoryRow(stats: SystemStats): void {
  // Memory
  const memRow = document.getElementById('monitorMemory');
  if (memRow) {
    paintFill(memRow, stats.memory.usage);
    memRow.dataset.tooltip = `${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}`;
    const value = memRow.querySelector('.monitor-value');
    if (value) {
      value.textContent = `${stats.memory.usage.toFixed(0)}% · ${formatBytes(stats.memory.used)}/${formatBytes(stats.memory.total)}`;
    }
  }
}
