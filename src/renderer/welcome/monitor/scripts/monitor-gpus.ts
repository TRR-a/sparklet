// Welcome monitor: GPU rows [欢迎页监控 - GPU 行]

import type { SystemStats } from 'sparklet/shared/types/system.js';
import { t } from '../../i18n/scripts/welcome-i18n.js';
import { formatBytes, ensureDynamicRow, paintFill } from './monitor-format.js';

/** Update dynamic GPU rows (N/A when no utilisation is reported) [更新动态 GPU 行 (无利用率时显示 N/A)] */
export function updateGpuRows(stats: SystemStats): void {
  // GPUs
  const gpuBox = document.getElementById('monitorGpus');
  if (gpuBox) {
    stats.gpus.forEach((gpu, i) => {
      const row = ensureDynamicRow(gpuBox, `gpu-${i}`);
      const label = row.querySelector('.monitor-label');
      if (label) label.textContent = gpu.name;
      row.dataset.tooltip = gpu.name;
      const fill = row.querySelector('.monitor-fill') as HTMLElement | null;
      const value = row.querySelector('.monitor-value');
      if (gpu.usage === null) {
        if (fill) fill.style.width = '0%';
        if (value) {
          value.textContent = 'N/A';
          value.classList.remove('long');
        }
        row.dataset.tooltip = `${gpu.name} · ${t('kernel.gpuNonNvidiaTip')}`;
      } else {
        if (value) value.classList.remove('long');
        paintFill(row, gpu.usage);
        if (value) {
          const vram = gpu.memoryTotal
            ? `${formatBytes(gpu.memoryUsed!)}/${formatBytes(gpu.memoryTotal)}`
            : '';
          value.textContent = `${gpu.usage.toFixed(0)}%`;
          row.dataset.tooltip = vram ? `${gpu.name} · VRAM ${vram}` : gpu.name;
        }
      }
    });
  }
}
