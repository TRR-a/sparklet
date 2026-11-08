// Settings cache: clear execution [设置缓存 - 执行清空]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import { showCustomConfirm } from 'sparklet/renderer/shared/ui/dialog/custom-dialog.js';
import { updaterApi } from 'sparklet/renderer/shared/index.js';
import { loadCacheInfo } from 'sparklet/renderer/app/settings/cache/info/scripts/cache-info-view.js';

/** Confirm, then clear the cache while disabling the button [先确认，随后在按钮禁用状态下清空缓存] */
export async function runClearCache(): Promise<void> {
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
    const result = await updaterApi.clearCache();
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
