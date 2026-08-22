// Settings: cache management section - handles cache info display, clear cache, dev lock [设置：缓存管理区域 - 处理缓存信息展示、清空缓存、开发环境锁定]

import { t } from '../../Modules/i18n.js';
import { showToast } from '../../Base/toast.js';
import { formatDateTime, formatDays } from '../../Base/dom-utils.js';
import { showCustomConfirm } from '../../Modules/custom-dialog.js';
import { getIsDevEnvironment } from './updater-config.js';
import {
  applyRetentionUI,
  saveRetentionDays,
  loadCacheRetentionDays
} from './cache-retention.js';
import type { CacheInfo } from '../../../../../shared/types/updater';

export { loadCacheRetentionDays };

/**
 * Render cache info to UI [渲染缓存信息到 UI]
 */
export function renderCacheInfo(info: CacheInfo | null): void {
  const box = document.getElementById('cacheInfo');
  if (!box) return;

  if (!info || !info.hasCache) {
    box.innerHTML = `<div class="cache-empty">${t('settings.cache.emptyTitle')}<br><span style="opacity:0.65;font-size:0.82rem;">${t('settings.cache.emptyTip')}</span></div>`;
    return;
  }

  // Parse success/fallback strategy: retentionDays, success/fallback determined by successFirstLaunchAt [解析成功/兜底策略：保留天数 info.retentionDays，成功/未成功由 successFirstLaunchAt 判断]
  const isSuccess = !!info.successFirstLaunchAt;
  const days = Number.isFinite(info.retentionDays as number) ? info.retentionDays : (isSuccess ? 7 : 30);
  const strategyText = isSuccess
    ? t('settings.cache.strategySuccess').replace('{days}', String(days))
    : t('settings.cache.strategyFallback').replace('{days}', String(days));
  const strategyClass = isSuccess ? 'cache-highlight' : 'cache-warn';

  const rows: Array<[string, string]> = [
    [t('settings.cache.label.version'), `<span class="cache-highlight">${info.version || '—'}</span>`],
    [t('settings.cache.label.size'), info.sizeFormatted || '0 B'],
    [t('settings.cache.label.downloadedAt'), formatDateTime(info.downloadedAt)],
    [t('settings.cache.label.firstLaunchAt'), info.successFirstLaunchAt ? formatDateTime(info.successFirstLaunchAt) : `<span class="cache-warn">${t('settings.cache.value.notConfirmed')}</span>`],
    [t('settings.cache.label.strategy'), `<span class="${strategyClass}">${strategyText}</span>`],
    [t('settings.cache.label.remaining'), `<span class="cache-highlight">${formatDays(info.remainingDays, t)}</span>`]
  ];

  if (info.totalCachedVersions > 1) {
    rows.push([t('settings.cache.label.totalVersions'), t('settings.cache.value.versionCount').replace('{n}', String(info.totalCachedVersions))]);
  }

  box.innerHTML = rows.map(([label, value]) =>
    `<div class="cache-row"><span class="cache-label">${label}</span><span class="cache-value">${value}</span></div>`
  ).join('');
}

/**
 * Load cache info from main process [从主进程加载缓存信息]
 */
export async function loadCacheInfo(): Promise<void> {
  try {
    const result = await window.electronAPI.getUpdateCacheInfo();
    if (result && result.success && result.info) {
      renderCacheInfo(result.info);
    } else {
      renderCacheInfo(null);
      if (result && result.error) {
        showToast(t('settings.toast.cacheReadFailed') + result.error);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('加载缓存信息失败:', msg);
    renderCacheInfo(null);
  }
}

/**
 * Handle clear cache button click [处理清空缓存按钮点击]
 */
export async function handleClearCache(): Promise<void> {
  if (getIsDevEnvironment()) {
    showToast(t('settings.devLock.cacheLocked'), 'info', 3000);
    return;
  }

  // Check if there's any cache first [先读一次看看有没有缓存]
  let hasCache = false;
  try {
    const r = await window.electronAPI.getUpdateCacheInfo();
    hasCache = !!(r && r.success && r.info && r.info.hasCache);
  } catch { /* ignore [忽略] */ }

  if (!hasCache) {
    showToast(t('settings.toast.cacheEmpty'), 'info', 2500);
    return;
  }

  const confirmed = await showCustomConfirm({
    title: t('confirm.clearCache.title'),
    message: t('confirm.clearCache.message'),
    okText: t('confirm.clearCache.ok'),
    cancelText: t('confirm.default.cancel'),
    okDanger: true
  });

  if (!confirmed) return;

  const btn = document.getElementById('clearCacheBtn') as HTMLButtonElement | null;
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = t('settings.cache.clearing'); }

  try {
    const result = await window.electronAPI.clearUpdateCache();
    if (result && result.success) {
      showToast(t('settings.toast.cacheCleared'));
      await loadCacheInfo();
    } else {
      const err = result ? result.error : t('settings.toast.unknownError');
      showToast(t('settings.toast.cacheClearFailed') + (err || ''));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('删除缓存失败:', msg);
    showToast(t('settings.toast.cacheClearPermission'));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }
}

/**
 * Apply dev environment lock to cache section [应用开发环境锁定到缓存区域]
 */
export function applyCacheDevLock(): void {
  const refreshBtn = document.getElementById('refreshCacheBtn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('clearCacheBtn') as HTMLButtonElement | null;
  const presets = document.querySelectorAll('#cacheRetentionPresets .retention-preset');
  const slider = document.getElementById('cacheRetentionSlider') as HTMLInputElement | null;
  const section = document.getElementById('updateCacheSection');

  if (!section) return;

  if (getIsDevEnvironment()) {
    // Dev environment: disable buttons, semi-transparent hint [开发环境：按钮禁用，section 半透明提示]
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = t('settings.devLock.refreshBtn');
      (refreshBtn as HTMLElement).title = t('settings.devLock.refreshBtnTitle');
    }
    if (clearBtn) {
      clearBtn.disabled = true;
      clearBtn.textContent = t('settings.devLock.clearBtn');
      (clearBtn as HTMLElement).title = t('settings.devLock.clearBtnTitle');
      (clearBtn as HTMLElement).style.opacity = '0.75';
    }
    // Disable days selection [禁用天数选择]
    presets.forEach(btn => { (btn as HTMLButtonElement).disabled = true; });
    if (slider) { slider.disabled = true; }
    // Hint line [提示行]
    const box = document.getElementById('cacheInfo');
    if (box && !box.getAttribute('data-dev-hinted')) {
      box.setAttribute('data-dev-hinted', '1');
      const devNote = document.createElement('div');
      devNote.style.cssText = 'margin-top:10px;padding:8px 10px;border-radius:6px;background:rgba(245,158,11,0.12);color:#b45309;font-size:0.82rem;line-height:1.45;';
      devNote.textContent = t('settings.devLock.cacheHint');
      box.appendChild(devNote);
      if (document.body.dataset.theme === 'dark') {
        devNote.style.background = 'rgba(245,158,11,0.15)';
        devNote.style.color = '#fbbf24';
      }
    }
  } else {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = t('settings.cache.refreshBtn');
      (refreshBtn as HTMLElement).title = '';
    }
    if (clearBtn) {
      clearBtn.disabled = false;
      clearBtn.textContent = t('settings.cache.clearBtn');
      (clearBtn as HTMLElement).title = '';
      (clearBtn as HTMLElement).style.opacity = '';
    }
    // Enable days selection [启用天数选择]
    presets.forEach(btn => { (btn as HTMLButtonElement).disabled = false; });
    if (slider) { slider.disabled = false; }
  }
}

/**
 * Bind cache event listeners [绑定缓存事件监听]
 */
export function bindCacheEvents(): void {
  const refreshBtn = document.getElementById('refreshCacheBtn');
  const clearBtn = document.getElementById('clearCacheBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', loadCacheInfo);
  if (clearBtn) clearBtn.addEventListener('click', handleClearCache);

  // Preset buttons click: save immediately [快捷按钮点击：立即保存]
  const presets = document.querySelectorAll('#cacheRetentionPresets .retention-preset');
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      if ((btn as HTMLButtonElement).disabled) return;
      const days = Number(btn.getAttribute('data-days'));
      applyRetentionUI(days, true);
      saveRetentionDays(days, true, loadCacheInfo);
    });
  });

  // Slider drag: real-time UI sync, debounced save [滑杆拖动：实时同步 UI，防抖保存]
  const slider = document.getElementById('cacheRetentionSlider') as HTMLInputElement | null;
  if (slider) {
    slider.addEventListener('input', () => {
      if (slider.disabled) return;
      const days = Number(slider.value);
      applyRetentionUI(days, false);
      saveRetentionDays(days, false);
    });
    // On release (change): ensure one more write to avoid missing IPC after fast drag [松开时 (change) 确保再写一次，避免用户快速拖动后 IPC 还没触发就切走]
    slider.addEventListener('change', () => {
      if (slider.disabled) return;
      const days = Number(slider.value);
      applyRetentionUI(days, true);
      saveRetentionDays(days, true, loadCacheInfo);
    });
  }
}
