// Settings: cache section event bindings [设置 - 缓存区事件绑定]

import {
  applyRetentionUI,
  saveRetentionDays
} from './cache-retention.js';
import { loadCacheInfo } from './cache-info-view.js';
import { handleClearCache } from './cache-actions.js';

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
