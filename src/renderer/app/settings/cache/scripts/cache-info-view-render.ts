// Settings: render cache info to UI [设置 - 渲染缓存信息到 UI]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { formatDateTime, formatDays } from 'sparklet/renderer/shared/ui/dom-utils.js';
import type { CacheInfo } from 'sparklet/shared/types/updater';

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
