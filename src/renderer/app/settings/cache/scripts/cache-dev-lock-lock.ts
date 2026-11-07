// Cache section: disable controls [缓存区 - 禁用控件]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';

/** Disable the cache controls with a semi-transparent hint [禁用缓存控件并给出半透明提示] */
export function lockCacheControls(): void {
  const refreshBtn = document.getElementById('refreshCacheBtn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('clearCacheBtn') as HTMLButtonElement | null;
  const presets = document.querySelectorAll('#cacheRetentionPresets .retention-preset');
  const slider = document.getElementById('cacheRetentionSlider') as HTMLInputElement | null;

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
}
