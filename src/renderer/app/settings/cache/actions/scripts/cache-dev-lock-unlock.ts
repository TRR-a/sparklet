// Cache section: re-enable controls [缓存区 - 恢复控件]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';

/** Re-enable the cache controls [恢复缓存控件] */
export function unlockCacheControls(): void {
  const refreshBtn = document.getElementById('refreshCacheBtn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('clearCacheBtn') as HTMLButtonElement | null;
  const presets = document.querySelectorAll('#cacheRetentionPresets .retention-preset');
  const slider = document.getElementById('cacheRetentionSlider') as HTMLInputElement | null;

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
