// Settings: updater config section - handles update behavior, interval, integrity check [设置：更新配置区域 - 处理更新行为、频率、完整性校验]

import { t } from '../../Modules/i18n.js';
import { showToast } from '../../Base/toast.js';
import type { UpdaterConfig } from '../../../../src/shared/types/updater';

/** Whether running in dev environment [是否开发环境] */
let isDevEnvironment = false;

/** Current updater config cache [当前更新配置缓存] */
let updaterConfig: UpdaterConfig | null = null;

/** Expose dev environment flag [暴露开发环境标志] */
export function getIsDevEnvironment(): boolean {
  return isDevEnvironment;
}

/** Expose current updater config [暴露当前更新配置] */
export function getUpdaterConfig(): UpdaterConfig | null {
  return updaterConfig;
}

/**
 * Update status text display [更新状态文本显示]
 */
export function updateStatusText(text: string, isError: boolean = false): void {
  const statusEl = document.getElementById('updaterStatus');
  if (!statusEl) return;
  statusEl.textContent = text;
  (statusEl as HTMLElement).style.color = isError ? '#ef4444' : '';
}

/**
 * Load updater config from main process and apply to UI [从主进程加载更新配置并应用到 UI]
 */
export async function loadUpdaterConfig(): Promise<void> {
  try {
    isDevEnvironment = await window.electronAPI.isDev();
    console.log('[Settings] Is dev environment:', isDevEnvironment);

    updaterConfig = await window.electronAPI.getUpdaterConfig();
    if (!updaterConfig) return;

    const behaviorSelect = document.getElementById('updateBehaviorSelect') as HTMLSelectElement | null;
    const intervalSelect = document.getElementById('updateIntervalSelect') as HTMLSelectElement | null;
    const checkBtn = document.getElementById('checkNowBtn');
    const integrityCheckbox = document.getElementById('integrityCheckToggle') as HTMLInputElement | null;

    if (isDevEnvironment) {
      // Dev environment: force lock UI [开发环境：强制锁定 UI]
      if (behaviorSelect) behaviorSelect.value = 'disabled';
      if (intervalSelect) intervalSelect.value = '1800000';
      if (behaviorSelect) behaviorSelect.disabled = true;
      if (intervalSelect) intervalSelect.disabled = true;

      if (checkBtn) {
        (checkBtn as HTMLButtonElement).disabled = true;
        checkBtn.textContent = t('settings.devLock.checkBtn');
        (checkBtn as HTMLElement).title = t('settings.devLock.checkBtnTitle');
      }

      // Disable integrity check checkbox in dev environment [开发环境禁用完整性校验复选框]
      if (integrityCheckbox) {
        integrityCheckbox.checked = false;
        integrityCheckbox.disabled = true;
        (integrityCheckbox as HTMLElement).title = t('settings.devLock.integrityTitle');
      }

      updateStatusText(t('settings.devLock.statusText'), false);
    } else {
      // Production: normal load [生产环境：正常加载]
      if (behaviorSelect) behaviorSelect.value = updaterConfig.updateBehavior || 'auto';
      if (intervalSelect) intervalSelect.value = String(updaterConfig.checkInterval || 86400000);
      if (behaviorSelect) behaviorSelect.disabled = false;
      if (intervalSelect && behaviorSelect) intervalSelect.disabled = behaviorSelect.value === 'disabled';

      if (checkBtn) {
        (checkBtn as HTMLButtonElement).disabled = false;
        checkBtn.textContent = t('settings.checkNow');
        (checkBtn as HTMLElement).title = '';
      }

      // Load integrity check checkbox [加载完整性校验复选框]
      if (integrityCheckbox) {
        integrityCheckbox.checked = updaterConfig.integrityCheck !== false; // Default true [默认 true]
        integrityCheckbox.disabled = false;
        (integrityCheckbox as HTMLElement).title = '';
      }

      updateStatusText(t('settings.status.ready'));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('加载更新配置失败:', msg);
  }
}

/**
 * Save updater config to main process [保存更新配置到主进程]
 */
export async function saveUpdaterConfig(): Promise<void> {
  if (isDevEnvironment) {
    showToast(t('settings.devLock.configLocked'), 'warning', 3000);
    return;
  }

  const behaviorSelect = document.getElementById('updateBehaviorSelect') as HTMLSelectElement | null;
  const intervalSelect = document.getElementById('updateIntervalSelect') as HTMLSelectElement | null;
  const integrityCheckbox = document.getElementById('integrityCheckToggle') as HTMLInputElement | null;

  if (!updaterConfig || !behaviorSelect || !intervalSelect) return;

  const newConfig: UpdaterConfig = {
    ...updaterConfig,
    updateBehavior: behaviorSelect.value as UpdaterConfig['updateBehavior'],
    checkInterval: parseInt(intervalSelect.value, 10)
  };

  // Save integrity check checkbox state [保存完整性校验复选框状态]
  if (integrityCheckbox) {
    newConfig.integrityCheck = integrityCheckbox.checked;
  }

  try {
    const result = await window.electronAPI.setUpdaterConfig(newConfig);
    if (result.success) {
      updaterConfig = newConfig;
      showToast(t('settings.toast.configSaved'));
      intervalSelect.disabled = behaviorSelect.value === 'disabled';
    } else {
      const msg = result.error || '';
      showToast(t('settings.toast.saveFailedPrefix') + msg);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('保存更新配置失败:', msg);
    showToast(t('settings.toast.saveFailedPermission'));
  }
}

/**
 * Handle manual check for updates [处理手动检查更新]
 */
export async function handleCheckNow(): Promise<void> {
  if (isDevEnvironment) {
    showToast(t('settings.devLock.checkNowToast'), 'info', 10000);
    return;
  }

  const btn = document.getElementById('checkNowBtn') as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = t('settings.status.checking');
  updateStatusText(t('settings.status.checkingUpdate'));

  try {
    await window.electronAPI.checkUpdateNow();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('手动检查失败:', msg);
    updateStatusText(t('settings.status.checkFailed'), true);
    btn.disabled = false;
    btn.textContent = t('settings.checkNow');
  }
}

/**
 * Bind updater event listeners [绑定更新模块事件监听]
 */
export function bindUpdaterEvents(): void {
  const behaviorSelect = document.getElementById('updateBehaviorSelect');
  const intervalSelect = document.getElementById('updateIntervalSelect');
  const integrityCheckbox = document.getElementById('integrityCheckToggle');

  if (behaviorSelect) {
    behaviorSelect.addEventListener('change', saveUpdaterConfig);
  }
  if (intervalSelect) {
    intervalSelect.addEventListener('change', saveUpdaterConfig);
  }
  if (integrityCheckbox) {
    integrityCheckbox.addEventListener('change', saveUpdaterConfig);
  }

  const checkBtn = document.getElementById('checkNowBtn');
  if (checkBtn) {
    checkBtn.addEventListener('click', handleCheckNow);
  }

  window.electronAPI.onUpdaterStatusChange((data: { checking?: boolean; done?: boolean; error?: string }) => {
    const btn = document.getElementById('checkNowBtn') as HTMLButtonElement | null;
    if (data.checking) {
      if (btn) { btn.disabled = true; btn.textContent = t('settings.status.checking'); }
      updateStatusText(t('settings.status.checkingUpdate'));
    } else if (data.done) {
      if (btn) { btn.disabled = false; btn.textContent = t('settings.checkNow'); }
      updateStatusText(t('settings.status.checkDone'));
      setTimeout(() => updateStatusText(t('settings.status.ready')), 3000);
    } else if (data.error) {
      if (btn) { btn.disabled = false; btn.textContent = t('settings.checkNow'); }
      updateStatusText(t('settings.status.checkFailedPrefix') + data.error, true);
      setTimeout(() => updateStatusText(t('settings.status.ready')), 5000);
    }
  });

  window.electronAPI.onUpdaterProgress((data: { msg?: string; percent?: number }) => {
    if (data.msg) {
      updateStatusText(data.msg + (data.percent !== undefined ? ` (${data.percent}%)` : ''));
    }
  });

  // Listen for config changes (auto refresh when config file modified externally) [监听配置变化 (手动修改配置文件后自动刷新)]
  window.electronAPI.onConfigChanged(async (config: UpdaterConfig) => {
    console.log('[Settings] Config changed externally, reloading...');
    updaterConfig = config;
    await loadUpdaterConfig();
    showToast(t('settings.toast.configUpdated'), 'info', 3000);
  });
}

/**
 * Load update hint text (replaces version placeholder) [加载更新提示 (替换版本号占位符)]
 */
export async function loadUpdateHint(): Promise<void> {
  try {
    const version = await window.electronAPI.getAppVersion();
    const hint = t('settings.updateHint');
    const updateHintEl = document.getElementById('updateHint');
    if (updateHintEl) {
      updateHintEl.textContent = hint.replace('{version}', `v${version}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('加载更新提示失败:', msg);
  }
}
