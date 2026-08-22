// Cache retention days configuration - slider, presets, UI sync [缓存保留天数配置 - 滑杆、快捷按钮、UI 同步]

import { t } from '../../Modules/i18n.js';

// Retention days config [保留天数配置]
export const RETENTION_MIN = 7;
export const RETENTION_MAX = 30;
export const RETENTION_DEFAULT = 7;

let currentRetentionDays = RETENTION_DEFAULT;
let retentionSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Get current retention days [获取当前保留天数]
 */
export function getCurrentRetentionDays(): number {
  return currentRetentionDays;
}

/**
 * Normalize retention days to valid range [min, max] as integer [规范化保留天数到合法范围 [min, max] 并取整]
 */
export function clampRetentionDays(days: unknown): number {
  const n = Number(days);
  if (!Number.isFinite(n)) return RETENTION_DEFAULT;
  return Math.max(RETENTION_MIN, Math.min(RETENTION_MAX, Math.round(n)));
}

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
  currentRetentionDays = safeDays;

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

/**
 * Save retention days to main process config (debounced 250ms on slider drag to avoid high-frequency IPC) [保存到主进程配置 (滑杆拖动时防抖 250ms 再提交，避免高频 IPC)]
 * @param onSaved Optional callback after successful save (e.g. refresh cache info) [保存成功后的可选回调 (如刷新缓存信息)]
 */
export async function saveRetentionDays(
  days: number,
  immediate: boolean = false,
  onSaved?: () => void | Promise<void>
): Promise<void> {
  if (!window.electronAPI || !window.electronAPI.setCacheRetentionDays) return;
  const safeDays = clampRetentionDays(days);

  if (retentionSaveTimer) {
    clearTimeout(retentionSaveTimer);
    retentionSaveTimer = null;
  }

  const doSave = async (): Promise<void> => {
    retentionSaveTimer = null;
    try {
      const result = await window.electronAPI.setCacheRetentionDays(safeDays);
      if (result && result.success) {
        if (onSaved) await onSaved();
        const daysStr = result.days !== undefined ? String(result.days) : String(safeDays);
        const { showToast } = await import('../../Base/toast.js');
        showToast(t('settings.toast.retentionSaved').replace('{days}', daysStr));
      } else if (result && result.error) {
        const { showToast } = await import('../../Base/toast.js');
        showToast(t('settings.toast.saveFailedPrefix') + result.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('保存保留天数失败:', msg);
      const { showToast } = await import('../../Base/toast.js');
      showToast(t('settings.toast.saveFailed'));
    }
  };

  if (immediate) {
    await doSave();
  } else {
    retentionSaveTimer = setTimeout(doSave, 250);
  }
}

/**
 * Load cache retention days from main process and apply to UI [从主进程读取当前配置并应用到 UI]
 */
export async function loadCacheRetentionDays(): Promise<void> {
  if (!window.electronAPI || !window.electronAPI.getCacheRetentionDays) return;
  try {
    const result = await window.electronAPI.getCacheRetentionDays();
    const days = result && Number.isFinite(result.days) ? result.days! : RETENTION_DEFAULT;
    applyRetentionUI(days, false);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('加载保留天数配置失败:', msg);
    applyRetentionUI(RETENTION_DEFAULT, false);
  }
}
