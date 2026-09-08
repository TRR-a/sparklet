// Kernel renderer: the microkernel Hub UI [内核渲染层：微内核 Hub 界面]
// Shows the discovered plugins (or an empty state when none are installed),
// applies the app theme (light/dark/blue) and wires window controls. It has
// no dependency on any plugin — it is the shell every Sparklet install gets.
// [展示已发现插件 (未安装时显示空状态)，应用主题 (light/dark/blue) 并绑定窗口
// 控制。它不依赖任何插件——是所有 Sparklet 安装都会获得的壳]

import { storeApi, broadcastApi, windowApi, pluginsApi, systemApi, APP_VERSION, APP_CODENAME } from '../core/index.js';
import type { PluginDescriptor } from '../../shared/types/plugins.js';
import type { SystemStats } from '../../shared/types/system.js';

// ========== Lightweight i18n (kernel is plugin-independent) [轻量 i18n (内核与插件无关)] ==========
const STRINGS: Record<string, Record<string, string>> = {
  en: {
    'kernel.title': 'Sparklet Hub',
    'kernel.subtitle': 'Extend your workspace with plugins',
    'kernel.emptyTitle': 'No plugins installed',
    'kernel.emptyDesc': 'Install a plugin to unlock more features',
    'kernel.open': 'Open',
    'kernel.monitor': 'System monitor',
    'kernel.memory': 'Memory',
    'kernel.gpu': 'GPU',
    'kernel.na': 'N/A',
    'kernel.gpuNonNvidia': 'non-NVIDIA GPU: this system cannot provide utilization data for non-NVIDIA GPUs',
    'kernel.gpuNonNvidiaTip': 'Real-time GPU utilization is only readable on NVIDIA GPUs via nvidia-smi',
  },
  'zh-CN': {
    'kernel.title': 'Sparklet 中枢',
    'kernel.subtitle': '用插件扩展你的工作台',
    'kernel.emptyTitle': '未安装任何插件',
    'kernel.emptyDesc': '安装插件以解锁更多功能',
    'kernel.open': '打开',
    'kernel.monitor': '系统监控',
    'kernel.memory': '内存',
    'kernel.gpu': 'GPU',
    'kernel.na': '暂无',
    'kernel.gpuNonNvidia': '非NVIDIA显卡暂时因系统对应非NVIDIA显卡无法提供GPU占用数据',
    'kernel.gpuNonNvidiaTip': '实时 GPU 占用仅支持经 nvidia-smi 读取的 NVIDIA 显卡',
  },
};

let currentLang = 'en';

function t(key: string): string {
  const pack = STRINGS[currentLang] ?? STRINGS.en;
  return pack[key] ?? STRINGS.en[key] ?? key;
}

function applyI18n(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
}

// ========== Theme [主题] ==========
async function loadTheme(): Promise<void> {
  const theme = await storeApi.get<string>('theme');
  document.body.dataset.theme = theme || 'light';
}

function bindThemeBroadcast(): void {
  broadcastApi.onThemeBroadcast((theme: unknown) => {
    document.body.dataset.theme = (theme as string) || 'light';
  });
}

// ========== Window controls [窗口控制] ==========
function bindWindowControls(): void {
  document.querySelector('.window-btn.minimize')?.addEventListener('click', () => windowApi.minimize());
  document.querySelector('.window-btn.maximize')?.addEventListener('click', () => windowApi.maximize());
  document.querySelector('.window-btn.close')?.addEventListener('click', () => windowApi.close());
  document.getElementById('windowPinBtn')?.addEventListener('click', async () => {
    const pinned = await windowApi.toggleAlwaysOnTop();
    const btn = document.getElementById('windowPinBtn');
    if (btn) btn.style.opacity = pinned ? '1' : '0.45';
  });
}

// ========== System monitor [系统监控] ==========
const MONITOR_REFRESH_MS = 2000;

/** Format bytes as a compact GB/MB string [字节格式化为紧凑的 GB/MB 字符串] */
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 GB';
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

/** Apply usage percent to a bar fill and toggle warn/danger tiers [把使用率应用到进度条并切换告警分级] */
function paintFill(row: HTMLElement, percent: number): void {
  const fill = row.querySelector('.monitor-fill') as HTMLElement | null;
  if (!fill) return;
  fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  fill.classList.toggle('warn', percent >= 70 && percent < 90);
  fill.classList.toggle('danger', percent >= 90);
}

/** Find an existing dynamic row by key, or create one [按 key 查找动态行，没有则创建] */
function ensureDynamicRow(container: HTMLElement, key: string): HTMLElement {
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

function updateMonitor(stats: SystemStats): void {
  // CPU
  const cpuRow = document.getElementById('monitorCpu');
  if (cpuRow) {
    const label = cpuRow.querySelector('.monitor-label');
    if (label) label.textContent = 'CPU';
    cpuRow.title = `${stats.cpu.model} · ${stats.cpu.cores} ${currentLang === 'zh-CN' ? '线程' : 'threads'}`;
    paintFill(cpuRow, stats.cpu.usage);
    const value = cpuRow.querySelector('.monitor-value');
    if (value) value.textContent = `${stats.cpu.usage.toFixed(0)}%`;
  }

  // Memory
  const memRow = document.getElementById('monitorMemory');
  if (memRow) {
    paintFill(memRow, stats.memory.usage);
    const value = memRow.querySelector('.monitor-value');
    if (value) {
      value.textContent = `${stats.memory.usage.toFixed(0)}% · ${formatBytes(stats.memory.used)}/${formatBytes(stats.memory.total)}`;
    }
  }

  // Disks
  const diskBox = document.getElementById('monitorDisks');
  if (diskBox) {
    stats.disks.forEach((disk) => {
      const row = ensureDynamicRow(diskBox, `disk-${disk.mount}`);
      const label = row.querySelector('.monitor-label');
      if (label) label.textContent = disk.mount;
      paintFill(row, disk.usage);
      const value = row.querySelector('.monitor-value');
      if (value) value.textContent = `${disk.usage.toFixed(0)}% · ${formatBytes(disk.used)}/${formatBytes(disk.total)}`;
    });
  }

  // GPUs
  const gpuBox = document.getElementById('monitorGpus');
  if (gpuBox) {
    stats.gpus.forEach((gpu, i) => {
      const row = ensureDynamicRow(gpuBox, `gpu-${i}`);
      const label = row.querySelector('.monitor-label');
      if (label) label.textContent = gpu.name;
      row.title = gpu.name;
      const fill = row.querySelector('.monitor-fill') as HTMLElement | null;
      const value = row.querySelector('.monitor-value');
      if (gpu.usage === null) {
        if (fill) fill.style.width = '0%';
        if (value) {
          value.textContent = t('kernel.gpuNonNvidia');
          value.classList.add('long');
        }
        row.title = `${gpu.name}\n${t('kernel.gpuNonNvidiaTip')}`;
      } else {
        if (value) value.classList.remove('long');
        paintFill(row, gpu.usage);
        if (value) {
          const vram = gpu.memoryTotal
            ? ` · ${formatBytes(gpu.memoryUsed!)}/${formatBytes(gpu.memoryTotal)}`
            : '';
          value.textContent = `${gpu.usage.toFixed(0)}%${vram}`;
        }
      }
    });
  }
}

async function refreshMonitor(): Promise<void> {
  try {
    const stats = await systemApi.stats();
    updateMonitor(stats);
  } catch (err) {
    console.warn('[Kernel] system stats failed:', err);
  }
}

// ========== Plugin rendering [插件渲染] ==========
function pluginCard(plugin: PluginDescriptor): HTMLElement {
  const card = document.createElement('div');
  card.className = 'plugin-card';

  const header = document.createElement('div');
  header.className = 'plugin-card-header';

  const meta = document.createElement('div');
  meta.className = 'plugin-meta';

  const name = document.createElement('div');
  name.className = 'plugin-name';
  const localized = currentLang && plugin.nameI18n?.[currentLang]
    ? plugin.nameI18n[currentLang]
    : plugin.nameI18n?.['en'] ?? plugin.name;
  name.textContent = localized;

  const version = document.createElement('div');
  version.className = 'plugin-version';
  version.textContent = `v${plugin.version}`;

  meta.append(name, version);

  if (plugin.iconPath) {
    const img = document.createElement('img');
    img.className = 'plugin-icon';
    img.src = plugin.iconPath;
    img.alt = plugin.name;
    header.append(img);
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'plugin-icon plugin-icon-fallback';
    fallback.textContent = plugin.name.charAt(0).toUpperCase();
    header.append(fallback);
  }
  header.append(meta);

  const desc = document.createElement('div');
  desc.className = 'plugin-desc';
  desc.textContent = plugin.description;
  desc.title = plugin.description;

  const openBtn = document.createElement('button');
  openBtn.className = 'plugin-open-btn';
  openBtn.textContent = t('kernel.open');
  openBtn.addEventListener('click', () => pluginsApi.open(plugin.id));

  card.append(header, desc, openBtn);
  return card;
}

async function renderPlugins(): Promise<void> {
  const plugins = await pluginsApi.list();
  const grid = document.getElementById('pluginGrid');
  const empty = document.getElementById('emptyState');
  if (!grid || !empty) return;

  grid.innerHTML = '';
  if (plugins.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.style.display = 'grid';
  for (const plugin of plugins) {
    grid.appendChild(pluginCard(plugin));
  }
}

// ========== Init [初始化] ==========
async function init(): Promise<void> {
  const saved = await storeApi.get<string>('language');
  currentLang = saved === 'zh-CN' ? 'zh-CN' : 'en';
  applyI18n();

  await loadTheme();
  bindThemeBroadcast();
  bindWindowControls();
  await renderPlugins();

  // System monitor: immediate sample then periodic refresh [系统监控：立即采样一次后周期刷新]
  await refreshMonitor();
  setInterval(() => void refreshMonitor(), MONITOR_REFRESH_MS);

  const versionEl = document.getElementById('kernelVersion');
  if (versionEl) versionEl.textContent = `Sparklet v${APP_VERSION} · ${APP_CODENAME}`;
}

void init();
