// Kernel renderer: the microkernel Hub UI [内核渲染层：微内核 Hub 界面]
// Shows the discovered plugins (or an empty state when none are installed),
// applies the app theme (light/dark/blue) and wires window controls. It has
// no dependency on any plugin — it is the shell every Sparklet install gets.
// [展示已发现插件 (未安装时显示空状态)，应用主题 (light/dark/blue) 并绑定窗口
// 控制。它不依赖任何插件——是所有 Sparklet 安装都会获得的壳]

import { storeApi, broadcastApi, windowApi, pluginsApi, systemApi, logApi, installGlobalErrorHooks, APP_VERSION, APP_CODENAME } from '../core/index.js';
import { restoreWidgetOrder, enableWidgetDragReorder } from './widget-drag.js';
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
    'kernel.navHome': 'Home',
    'kernel.navPages': 'Plugins',
    'kernel.pagesTitle': 'Plugin management',
    'kernel.monitor': 'System monitor',
    'kernel.memory': 'Memory',
    'kernel.gpu': 'GPU',
    'kernel.na': 'N/A',
    'kernel.gpuNonNvidia': 'non-NVIDIA GPU: this system cannot provide utilization data for non-NVIDIA GPUs',
    'kernel.gpuNonNvidiaTip': 'Real-time GPU utilization is only readable on NVIDIA GPUs via nvidia-smi',
    'kernel.logs': 'Logs',
    'kernel.logsErrors': 'errors',
    'kernel.logsWarns': 'warnings',
    'kernel.logsOpen': 'Open logs folder',
  },
  'zh-CN': {
    'kernel.title': 'Sparklet 中枢',
    'kernel.subtitle': '用插件扩展你的工作台',
    'kernel.emptyTitle': '未安装任何插件',
    'kernel.emptyDesc': '安装插件以解锁更多功能',
    'kernel.open': '打开',
    'kernel.navHome': '主页',
    'kernel.navPages': '分页管理',
    'kernel.pagesTitle': '分页管理',
    'kernel.monitor': '系统监控',
    'kernel.memory': '内存',
    'kernel.gpu': 'GPU',
    'kernel.na': '暂无',
    'kernel.gpuNonNvidia': '非NVIDIA显卡暂时因系统对应非NVIDIA显卡无法提供GPU占用数据',
    'kernel.gpuNonNvidiaTip': '实时 GPU 占用仅支持经 nvidia-smi 读取的 NVIDIA 显卡',
    'kernel.logs': '日志',
    'kernel.logsErrors': '错误',
    'kernel.logsWarns': '警告',
    'kernel.logsOpen': '打开日志文件夹',
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

// ========== Logs card [日志卡片] ==========
/** Count ERROR / WARN lines in the tail and paint the counts [统计尾部日志中 ERROR / WARN 数量并渲染] */
async function refreshLogStats(): Promise<void> {
  try {
    const res = await systemApi.tailLogs(500);
    if (!res.success || !res.lines) return;
    let errors = 0;
    let warns = 0;
    for (const line of res.lines) {
      if (line.includes('[ERROR')) errors++;
      else if (line.includes('[WARN')) warns++;
    }
    const errEl = document.getElementById('logErrorCount');
    const warnEl = document.getElementById('logWarnCount');
    if (errEl) errEl.textContent = String(errors);
    if (warnEl) warnEl.textContent = String(warns);
  } catch (err) {
    console.warn('[Kernel] log stats failed:', err);
  }
}

/** Bind the "open logs folder" button [绑定"打开日志文件夹"按钮] */
function bindLogCard(): void {
  document.getElementById('logOpenBtn')?.addEventListener('click', () => {
    void systemApi.openLogsFolder();
  });
}

// ========== Time cards (calendar / analog / digital) [时间卡片 (日历/钟面/电子钟)] ==========
const SVG_NS = 'http://www.w3.org/2000/svg';
let lastCalKey = '';

/** 12-hour format toggle for the digital clock (default 24h) [电子时钟 12 小时制开关 (默认 24 小时制)] */
let use12Hour = false;

/** Selected day-of-month in the displayed month (null = today highlighted) [日历中选中的日期 (null = 高亮今天)] */
let selectedDay: number | null = null;

function clockLocale(): string {
  return currentLang === 'zh-CN' ? 'zh-CN' : 'en-US';
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO week number of a date [日期的 ISO 周数] */
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Timezone label like GMT+8 / GMT+5:30 [形如 GMT+8 / GMT+5:30 的时区标签] */
function tzLabel(): string {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const h = Math.floor(Math.abs(offset) / 60);
  const m = Math.abs(offset) % 60;
  return `GMT${sign}${h}${m ? `:${pad2(m)}` : ''}`;
}

/** Draw the 12 hour dots on the minimal face once; 12/3/6/9 are larger [一次性绘制钟面 12 个刻度点；12/3/6/9 略大] */
function buildAnalogTicks(): void {
  const g = document.getElementById('analogTicks');
  if (!g || g.childElementCount > 0) return;
  for (let i = 0; i < 12; i++) {
    const angle = ((i * 30 - 90) * Math.PI) / 180; // 0h at 12 o'clock [0 点指向正上方]
    const r = 44;
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(50 + r * Math.cos(angle)));
    dot.setAttribute('cy', String(50 + r * Math.sin(angle)));
    dot.setAttribute('r', i % 3 === 0 ? '2.2' : '1.3');
    dot.setAttribute('class', `analog-dot${i % 3 === 0 ? ' major' : ''}`);
    g.appendChild(dot);
  }
}

/** Render the month grid; leading/trailing cells show adjacent-month days dimmed [渲染月历，首尾空格以暗色显示相邻月份日期] */
function renderCalendar(now: Date): void {
  const title = document.getElementById('calTitle');
  const weekdays = document.getElementById('calWeekdays');
  const grid = document.getElementById('calGrid');
  if (!title || !weekdays || !grid) return;
  const loc = clockLocale();
  title.textContent = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'long' }).format(now);

  weekdays.innerHTML = '';
  for (let d = 0; d < 7; d++) {
    // 2023-01-01 is a Sunday, giving a stable Sun..Sat header [2023-01-01 为周日，得到稳定的周日..周六表头]
    const base = new Date(2023, 0, 1 + d);
    const cell = document.createElement('span');
    cell.className = 'calendar-weekday';
    cell.textContent = new Intl.DateTimeFormat(loc, { weekday: 'narrow' }).format(base);
    weekdays.appendChild(cell);
  }

  const year = now.getFullYear();
  const month = now.getMonth();
  const startBlank = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  grid.innerHTML = '';
  for (let i = 0; i < startBlank; i++) {
    const cell = document.createElement('span');
    cell.className = 'calendar-day muted';
    cell.textContent = String(prevMonthDays - startBlank + 1 + i);
    grid.appendChild(cell);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('span');
    const isToday = d === now.getDate();
    const isSelected = selectedDay === d;
    cell.className = 'calendar-day';
    // Before any selection: today is filled blue. After selecting another day:
    // today keeps a blue ring, the picked day gets a grey fill, others are muted.
    // [未选中时今天蓝色填充；选中其他日后今天保留蓝描边，被选日灰色填充，其余弱色]
    if (selectedDay === null) {
      if (isToday) cell.classList.add('today');
      else cell.classList.add('normal');
    } else {
      if (isToday) cell.classList.add('today-ring');
      else if (isSelected) cell.classList.add('selected');
      else cell.classList.add('normal');
    }
    cell.textContent = String(d);
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', () => {
      // Clicking today again clears the selection back to default [再点今天则清除选中回到默认]
      selectedDay = isToday ? null : d;
      renderCalendar(now);
    });
    grid.appendChild(cell);
  }
  const filled = startBlank + daysInMonth;
  const trailing = (7 - (filled % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    const cell = document.createElement('span');
    cell.className = 'calendar-day muted';
    cell.textContent = String(i);
    grid.appendChild(cell);
  }
}

/** Per-second refresh of hands, digital clock and details; calendar redraws on day change [每秒刷新指针、方时钟与详细信息；跨天时重绘日历] */
function tickClocks(): void {
  const now = new Date();
  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hour = now.getHours();

  const handHour = document.getElementById('handHour');
  const handMinute = document.getElementById('handMinute');
  const handSecond = document.getElementById('handSecond');
  handHour?.setAttribute('transform', `rotate(${(hour % 12) * 30 + min * 0.5} 50 50)`);
  handMinute?.setAttribute('transform', `rotate(${min * 6 + sec * 0.1} 50 50)`);
  handSecond?.setAttribute('transform', `rotate(${sec * 6} 50 50)`);

  // HH:MM carries the visual weight; seconds tick beside it in muted color [主时间为 HH:MM，秒数以弱色伴随]
  // 12-hour mode: 1-12 without leading zero + AM/PM beside the seconds [12 小时制：1-12 不补零，秒数旁附 AM/PM]
  const digital = document.getElementById('digitalTime');
  if (digital) {
    digital.textContent = use12Hour ? `${hour % 12 || 12}:${pad2(min)}` : `${pad2(hour)}:${pad2(min)}`;
  }
  const secEl = document.getElementById('digitalSec');
  if (secEl) secEl.textContent = `:${pad2(sec)}${use12Hour ? (hour < 12 ? ' AM' : ' PM') : ''}`;

  // Details block: weekday, full date, week number, timezone [详细信息：星期、完整日期、周数、时区]
  const loc = clockLocale();
  const weekdayEl = document.getElementById('detailWeekday');
  if (weekdayEl) weekdayEl.textContent = new Intl.DateTimeFormat(loc, { weekday: 'long' }).format(now);
  const dateEl = document.getElementById('detailDate');
  if (dateEl) dateEl.textContent = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'long', day: 'numeric' }).format(now);
  const weekEl = document.getElementById('detailWeek');
  if (weekEl) weekEl.textContent = currentLang === 'zh-CN' ? `第 ${isoWeek(now)} 周` : `Week ${isoWeek(now)}`;
  const tzEl = document.getElementById('detailTz');
  if (tzEl) tzEl.textContent = tzLabel();

  const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  if (key !== lastCalKey) {
    renderCalendar(now);
    lastCalKey = key;
  }
}

// ========== Plugin rendering [插件渲染] ==========
let cachedPlugins: PluginDescriptor[] = [];

/** Localized plugin name [本地化插件名] */
function localizedPluginName(plugin: PluginDescriptor): string {
  return currentLang && plugin.nameI18n?.[currentLang]
    ? plugin.nameI18n[currentLang]
    : plugin.nameI18n?.['en'] ?? plugin.name;
}

function pluginCard(plugin: PluginDescriptor): HTMLElement {
  const card = document.createElement('div');
  card.className = 'plugin-card';

  const header = document.createElement('div');
  header.className = 'plugin-card-header';

  const meta = document.createElement('div');
  meta.className = 'plugin-meta';

  const name = document.createElement('div');
  name.className = 'plugin-name';
  name.textContent = localizedPluginName(plugin);

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

/** One row in the plugin-management view [分页管理视图中的一行] */
function manageItem(plugin: PluginDescriptor): HTMLElement {
  const row = document.createElement('div');
  row.className = 'manage-item';

  if (plugin.iconPath) {
    const img = document.createElement('img');
    img.className = 'plugin-icon';
    img.src = plugin.iconPath;
    img.alt = plugin.name;
    row.append(img);
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'plugin-icon plugin-icon-fallback';
    fallback.textContent = plugin.name.charAt(0).toUpperCase();
    row.append(fallback);
  }

  const info = document.createElement('div');
  info.className = 'manage-info';
  const nameRow = document.createElement('div');
  nameRow.className = 'manage-name-row';
  const name = document.createElement('span');
  name.className = 'manage-name';
  name.textContent = localizedPluginName(plugin);
  const version = document.createElement('span');
  version.className = 'manage-version';
  version.textContent = `v${plugin.version}${plugin.author ? ` · ${plugin.author}` : ''}`;
  nameRow.append(name, version);
  const idLine = document.createElement('div');
  idLine.className = 'manage-path';
  idLine.textContent = plugin.id;
  info.append(nameRow, idLine);

  const openBtn = document.createElement('button');
  openBtn.className = 'manage-open-btn';
  openBtn.textContent = t('kernel.open');
  openBtn.addEventListener('click', () => pluginsApi.open(plugin.id));

  row.append(info, openBtn);
  return row;
}

async function renderPlugins(): Promise<void> {
  cachedPlugins = await pluginsApi.list();
  const grid = document.getElementById('pluginGrid');
  const empty = document.getElementById('emptyState');
  if (!grid || !empty) return;

  grid.innerHTML = '';
  if (cachedPlugins.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    grid.style.display = 'grid';
    for (const plugin of cachedPlugins) grid.appendChild(pluginCard(plugin));
  }
  renderManageList();
}

/** Render the plugin-management view from cached plugins [用缓存的插件渲染分页管理视图] */
function renderManageList(): void {
  const list = document.getElementById('manageList');
  const empty = document.getElementById('manageEmpty');
  if (!list || !empty) return;
  list.innerHTML = '';
  if (cachedPlugins.length === 0) {
    list.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  list.style.display = 'flex';
  for (const plugin of cachedPlugins) list.appendChild(manageItem(plugin));
}

// ========== Navigation (left rail) [左侧导航栏] ==========
function switchView(view: 'home' | 'pages'): void {
  const home = document.getElementById('viewHome');
  const pages = document.getElementById('viewPages');
  if (home) home.style.display = view === 'home' ? 'flex' : 'none';
  if (pages) pages.style.display = view === 'pages' ? 'flex' : 'none';
  document.querySelectorAll<HTMLButtonElement>('.rail-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

function bindNavigation(): void {
  document.querySelectorAll<HTMLButtonElement>('.rail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === 'home' || view === 'pages') switchView(view);
    });
  });
}

// ========== Init [初始化] ==========
async function init(): Promise<void> {
  // Uncaught errors/rejections go to the log file before anything else
  // [任何逻辑执行前先装好未捕获错误/拒绝的日志转发]
  installGlobalErrorHooks('kernel');
  const saved = await storeApi.get<string>('language');
  currentLang = saved === 'zh-CN' ? 'zh-CN' : 'en';
  applyI18n();

  await loadTheme();
  bindThemeBroadcast();

  // Clock format: read once, then follow the settings toggle live [时钟制式：先读一次，随后实时跟随设置开关]
  use12Hour = (await storeApi.get<boolean>('clock12Hour')) === true;
  broadcastApi.onClockFormatBroadcast((enabled) => {
    use12Hour = Boolean(enabled);
    tickClocks();
  });

  bindWindowControls();
  bindNavigation();
  switchView('home');
  await renderPlugins();
  logApi.info('kernel', `Renderer ready, ${cachedPlugins.length} plugin(s) discovered`);

  // Widget board: restore saved card order then enable drag-to-reorder [卡片板：恢复顺序后启用拖拽重排]
  const board = document.getElementById('widgetBoard');
  if (board) {
    await restoreWidgetOrder(board);
    enableWidgetDragReorder(board);
  }

  // System monitor: immediate sample then periodic refresh [系统监控：立即采样一次后周期刷新]
  await refreshMonitor();
  setInterval(() => void refreshMonitor(), MONITOR_REFRESH_MS);

  // Logs card: bind open button then read counts once [日志卡片：绑定打开按钮后读取一次计数]
  bindLogCard();
  await refreshLogStats();
  setInterval(() => void refreshLogStats(), 10000);

  // Time cards: build the analog face, tick immediately then every second [时间卡片：构建钟面，立即走时后每秒刷新]
  buildAnalogTicks();
  tickClocks();
  setInterval(tickClocks, 1000);

}

void init();
