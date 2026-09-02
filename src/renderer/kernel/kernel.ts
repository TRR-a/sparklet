// Kernel renderer: the microkernel Hub UI [内核渲染层：微内核 Hub 界面]
// Shows the discovered plugins (or an empty state when none are installed),
// applies the app theme (light/dark/blue) and wires window controls. It has
// no dependency on any plugin — it is the shell every Sparklet install gets.
// [展示已发现插件 (未安装时显示空状态)，应用主题 (light/dark/blue) 并绑定窗口
// 控制。它不依赖任何插件——是所有 Sparklet 安装都会获得的壳]

import { storeApi, broadcastApi, windowApi, pluginsApi, APP_VERSION, APP_CODENAME } from '../core/index.js';
import type { PluginDescriptor } from '../../shared/types/plugins.js';

// ========== Lightweight i18n (kernel is plugin-independent) [轻量 i18n (内核与插件无关)] ==========
const STRINGS: Record<string, Record<string, string>> = {
  en: {
    'kernel.title': 'Sparklet Hub',
    'kernel.subtitle': 'Extend your workspace with plugins',
    'kernel.emptyTitle': 'No plugins installed',
    'kernel.emptyDesc': 'Install a plugin to unlock more features',
    'kernel.open': 'Open',
  },
  'zh-CN': {
    'kernel.title': 'Sparklet 中枢',
    'kernel.subtitle': '用插件扩展你的工作台',
    'kernel.emptyTitle': '未安装任何插件',
    'kernel.emptyDesc': '安装插件以解锁更多功能',
    'kernel.open': '打开',
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

  const versionEl = document.getElementById('kernelVersion');
  if (versionEl) versionEl.textContent = `Sparklet v${APP_VERSION} · ${APP_CODENAME}`;
}

void init();
