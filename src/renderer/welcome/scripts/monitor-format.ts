// Welcome monitor: rows & formatting helpers [欢迎页监控 - 行与格式化辅助]

/** Format bytes as a compact GB/MB string [字节格式化为紧凑的 GB/MB 字符串] */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 GB';
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

/** Apply usage percent to a bar fill and toggle warn/danger tiers [把使用率应用到进度条并切换告警分级] */
export function paintFill(row: HTMLElement, percent: number): void {
  const fill = row.querySelector('.monitor-fill') as HTMLElement | null;
  if (!fill) return;
  fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  fill.classList.toggle('warn', percent >= 70 && percent < 90);
  fill.classList.toggle('danger', percent >= 90);
}

/** Find an existing dynamic row by key, or create one [按 key 查找动态行，没有则创建] */
export function ensureDynamicRow(container: HTMLElement, key: string): HTMLElement {
  let row = container.querySelector<HTMLElement>(`.monitor-row[data-key="${key}"]`);
  if (row) return row;
  row = document.createElement('div');
  row.className = 'monitor-row';
  row.setAttribute('data-key', key);
  row.innerHTML = `
    <span class="monitor-label"></span>
    <div class="monitor-bar"><div class="monitor-fill"></div></div>
    <span class="monitor-value"></span>`;
  container.appendChild(row);
  return row;
}
