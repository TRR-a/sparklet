// Cache retention UI sync (slider / presets / label) [缓存保留天数 UI 同步 (滑杆/快捷按钮/文本)]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { clampRetentionDays } from 'sparklet/renderer/app/settings/cache/retention/scripts/cache-retention-constants.js';
import { setCurrentRetentionDays } from 'sparklet/renderer/app/settings/cache/retention/scripts/cache-retention-state.js';

/**
 * Update "current: X days" label text, optionally with bump animation [更新「当前：X 天」文本，可选带弹跳动画]
 */
function updateRetentionCurrentLabel(days: number, animate: boolean = false): void {
  const label = document.getElementById('cacheRetentionCurrent');
  if (!label) return;
  const safeDays = clampRetentionDays(days);
  label.textContent = t('fmt.days.count').replace('{n}', String(safeDays));
  if (animate) {
    label.classList.remove('bump');
    // Force reflow to trigger animation [强制 reflow 触发动画]
    void label.offsetWidth;
    label.classList.add('bump');
  }
}

/**
 * Apply retention days to UI: slider value, preset buttons highlight, current label [根据传入的天数同步刷新 UI：滑杆 value、快捷按钮高亮、当前文本]
 */
export function applyRetentionUI(days: number, animate: boolean = false): void {
  const safeDays = clampRetentionDays(days);
  setCurrentRetentionDays(safeDays);

  // Slider [滑杆]
  const slider = document.getElementById('cacheRetentionSlider') as HTMLInputElement | null;
  if (slider && Number(slider.value) !== safeDays) {
    slider.value = String(safeDays);
  }

  // Preset buttons active state [快捷按钮 active]
  const presets = document.querySelectorAll('#cacheRetentionPresets .retention-preset');
  presets.forEach(btn => {
    const d = Number(btn.getAttribute('data-days'));
    btn.classList.toggle('active', d === safeDays);
  });

  updateRetentionCurrentLabel(safeDays, animate);
}
