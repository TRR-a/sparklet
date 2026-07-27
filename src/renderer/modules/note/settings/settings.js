// settings.js - 设置窗口逻辑
// 说明：处理语言切换、窗口控制、主题同步等设置功能

import { initI18n, loadLanguage, getCurrentLang, t } from '../shared/i18n.js';

// ==================== Toast 提示 ====================
function showToast(message, type = 'info', duration = 3000) {
  // 兼容旧调用：showToast(msg, duration)（第二个参数是数字时视为 duration）
  if (typeof type === 'number') {
    duration = type;
    type = 'info';
  }

  const existing = document.querySelector('.toast-message');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.dataset.type = type;
  toast.textContent = message;

  // 根据 type 设置背景色
  let bg = 'rgba(0, 0, 0, 0.8)';
  if (type === 'warning') bg = 'rgba(245, 158, 11, 0.95)';
  if (type === 'error' || type === 'danger') bg = 'rgba(239, 68, 68, 0.95)';
  if (type === 'success') bg = 'rgba(16, 185, 129, 0.95)';

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 24px',
    borderRadius: '8px',
    background: bg,
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none'
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==================== 初始化 ====================
let isDevEnvironment = false;

async function loadThemeAndI18n() {
    const theme = await window.electronStore.get('theme');
    document.body.dataset.theme = theme || 'light';

    const currentLang = await initI18n();
    document.getElementById('languageSelect').value = currentLang;

    window.electronAPI.on('theme-broadcast', (theme) => {
        document.body.dataset.theme = theme;
    });
}

document.addEventListener('DOMContentLoaded', loadThemeAndI18n);

// ==================== 更新配置 ====================
let updaterConfig = null;

async function loadUpdaterConfig() {
  try {
    isDevEnvironment = await window.electronAPI.isDev();
    console.log('[Settings] Is dev environment:', isDevEnvironment);

    updaterConfig = await window.electronAPI.getUpdaterConfig();
    if (!updaterConfig) return;

    const behaviorSelect = document.getElementById('updateBehaviorSelect');
    const intervalSelect = document.getElementById('updateIntervalSelect');
    const checkBtn = document.getElementById('checkNowBtn');
    const integrityCheckbox = document.getElementById('integrityCheckToggle');

    if (isDevEnvironment) {
      // ========== 开发环境：强制锁定 UI ==========
      behaviorSelect.value = 'disabled';
      intervalSelect.value = '1800000';

      behaviorSelect.disabled = true;
      intervalSelect.disabled = true;

      if (checkBtn) {
        checkBtn.disabled = true;
        checkBtn.textContent = t('settings.devLock.checkBtn');
        checkBtn.title = t('settings.devLock.checkBtnTitle');
      }

      // 开发环境禁用完整性校验复选框
      if (integrityCheckbox) {
        integrityCheckbox.checked = false;
        integrityCheckbox.disabled = true;
        integrityCheckbox.title = t('settings.devLock.integrityTitle');
      }

      updateStatusText(t('settings.devLock.statusText'), false);
    } else {
      // ========== 生产环境：正常加载 ==========
      behaviorSelect.value = updaterConfig.updateBehavior || 'auto';
      intervalSelect.value = String(updaterConfig.checkInterval || 86400000);
      behaviorSelect.disabled = false;
      intervalSelect.disabled = behaviorSelect.value === 'disabled';

      if (checkBtn) {
        checkBtn.disabled = false;
        checkBtn.textContent = t('settings.checkNow');
        checkBtn.title = '';
      }

      // 加载完整性校验复选框
      if (integrityCheckbox) {
        integrityCheckbox.checked = updaterConfig.integrityCheck !== false; // 默认 true
        integrityCheckbox.disabled = false;
        integrityCheckbox.title = '';
      }

      updateStatusText(t('settings.status.ready'));
    }
  } catch (err) {
    console.error('加载更新配置失败:', err);
  }
}

function updateStatusText(text, isError = false) {
  const statusEl = document.getElementById('updaterStatus');
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#ef4444' : '';
}

async function saveUpdaterConfig() {
  if (isDevEnvironment) {
    showToast(t('settings.devLock.configLocked'), 'warning', 3000);
    return;
  }

  const behaviorSelect = document.getElementById('updateBehaviorSelect');
  const intervalSelect = document.getElementById('updateIntervalSelect');
  const integrityCheckbox = document.getElementById('integrityCheckToggle');

  if (!updaterConfig || !behaviorSelect || !intervalSelect) return;

  const newConfig = {
    ...updaterConfig,
    updateBehavior: behaviorSelect.value,
    checkInterval: parseInt(intervalSelect.value, 10)
  };

  // 保存完整性校验复选框状态
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
      showToast(t('settings.toast.saveFailedPrefix') + result.error);
    }
  } catch (err) {
    console.error('保存更新配置失败:', err);
    showToast(t('settings.toast.saveFailedPermission'));
  }
}

async function handleCheckNow() {
  if (isDevEnvironment) {
    showToast(t('settings.devLock.checkNowToast'), 'info', 10000);
    return;
  }

  const btn = document.getElementById('checkNowBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = t('settings.status.checking');
  updateStatusText(t('settings.status.checkingUpdate'));

  try {
    await window.electronAPI.checkUpdateNow();
  } catch (err) {
    console.error('手动检查失败:', err);
    updateStatusText(t('settings.status.checkFailed'), true);
    btn.disabled = false;
    btn.textContent = t('settings.checkNow');
  }
}

function bindUpdaterEvents() {
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

  window.electronAPI.onUpdaterStatusChange((data) => {
    const btn = document.getElementById('checkNowBtn');
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

  window.electronAPI.onUpdaterProgress((data) => {
    if (data.msg) {
      updateStatusText(data.msg + (data.percent !== undefined ? ` (${data.percent}%)` : ''));
    }
  });

  // ========== 监听配置变化（手动修改配置文件后自动刷新） ==========
  window.electronAPI.onConfigChanged(async (config) => {
    console.log('[Settings] Config changed externally, reloading...');
    updaterConfig = config;
    await loadUpdaterConfig();
    showToast(t('settings.toast.configUpdated'), 'info', 3000);
  });
}

// ==================== Toast 监听（从主进程接收） ====================
function bindToastListener() {
  window.electronAPI.onToastShow((data) => {
    // 支持两种 message 格式：
    // - 字符串：直接显示
    // - { key: 'i18n.key', params?: { foo: 'bar' } }：用渲染层 i18n 翻译（支持语言切换）
    let message = data.message;
    if (message && typeof message === 'object' && message.key) {
      message = t(message.key, message.params || {});
    }
    message = message || t('toast.defaultMessage');
    const duration = data.duration || 3000;
    const type = data.type || 'info';
    showToast(message, type, duration);
  });
}

// ==================== 初始化更新配置 ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadUpdaterConfig();
  bindUpdaterEvents();
  bindToastListener();
});

// ==================== 窗口控制 ====================
document.querySelector('.window-btn.minimize').addEventListener('click', () => {
    window.electronAPI.invoke('window-minimize');
});

document.querySelector('.window-btn.close').addEventListener('click', () => {
    window.electronAPI.invoke('window-close');
});

// ==================== 工具按钮 ====================
document.getElementById('openDevToolsBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-dev-tools-window');
});
document.getElementById('openAboutBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-about-window');
});
document.getElementById('openOfficialSiteBtn').addEventListener('click', async () => {
    try {
        const result = await window.electronAPI.openOfficialSite();
        if (!result || !result.success) {
            showToast(t('settings.toast.openSiteFailed'));
        }
    } catch (err) {
        console.error('打开官网失败:', err);
        showToast(t('settings.toast.openSiteFailed'));
    }
});

// ==================== 语言切换 ====================
document.getElementById('languageSelect').addEventListener('change', async (e) => {
    const newLang = e.target.value;
    const success = await loadLanguage(newLang);
    if (success) {
        showToast('✅ ' + t('settings.languageChangeSuccess'));
        console.log('语言已切换为：', newLang);
    }
});

// ==================== 自定义确认弹窗（避免系统原生弹窗）====================
/**
 * 弹出自定义确认框，返回 Promise<boolean>：true=用户点确定，false=用户点取消
 */
function showCustomConfirm({ title = t('confirm.default.title'), message = t('confirm.default.message'), okText = t('confirm.default.ok'), cancelText = t('confirm.default.cancel'), okDanger = false } = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('customConfirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');

    if (!modal || !titleEl || !msgEl || !okBtn || !cancelBtn) {
      resolve(false);
      return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;
    okBtn.style.background = okDanger ? '#ef4444' : '';

    modal.style.display = 'flex';

    let settled = false;
    // ESC 键取消 handler（定义在 finish 之前，供 finish 内部移除）
    const escHandler = (e) => {
      if (e.key === 'Escape') finish(false);
    };

    const finish = (result) => {
      if (settled) return;
      settled = true;
      // 任何 finish 路径（确定/取消/ESC）都移除 ESC 监听，避免内存泄漏
      document.removeEventListener('keydown', escHandler);
      modal.style.display = 'none';
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(result);
    };

    okBtn.onclick = () => finish(true);
    cancelBtn.onclick = () => finish(false);
    document.addEventListener('keydown', escHandler);
  });
}

// ==================== 更新包缓存：渲染 & 加载 ====================
function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function formatDays(days) {
  if (days === null || days === undefined || isNaN(days)) return '—';
  if (days < 0) return t('fmt.days.zero');
  if (days < 1) {
    const hours = Math.max(0, Math.round(days * 24));
    return t('fmt.hours.about').replace('{hours}', String(hours));
  }
  return t('fmt.days.about').replace('{days}', String(Math.ceil(days)));
}

function renderCacheInfo(info) {
  const box = document.getElementById('cacheInfo');
  if (!box) return;

  if (!info || !info.hasCache) {
    box.innerHTML = `<div class="cache-empty">${t('settings.cache.emptyTitle')}<br><span style="opacity:0.65;font-size:0.82rem;">${t('settings.cache.emptyTip')}</span></div>`;
    return;
  }

  // 解析成功/兜底策略：保留天数 info.retentionDays，成功/未成功由 successFirstLaunchAt 判断
  const isSuccess = !!info.successFirstLaunchAt;
  const days = Number.isFinite(info.retentionDays) ? info.retentionDays : (isSuccess ? 7 : 30);
  const strategyText = isSuccess
    ? t('settings.cache.strategySuccess').replace('{days}', String(days))
    : t('settings.cache.strategyFallback').replace('{days}', String(days));
  const strategyClass = isSuccess ? 'cache-highlight' : 'cache-warn';

  const rows = [
    [t('settings.cache.label.version'), `<span class="cache-highlight">${info.version || '—'}</span>`],
    [t('settings.cache.label.size'), info.sizeFormatted || '0 B'],
    [t('settings.cache.label.downloadedAt'), formatDate(info.downloadedAt)],
    [t('settings.cache.label.firstLaunchAt'), info.successFirstLaunchAt ? formatDate(info.successFirstLaunchAt) : `<span class="cache-warn">${t('settings.cache.value.notConfirmed')}</span>`],
    [t('settings.cache.label.strategy'), `<span class="${strategyClass}">${strategyText}</span>`],
    [t('settings.cache.label.remaining'), `<span class="cache-highlight">${formatDays(info.remainingDays)}</span>`]
  ];

  if (info.totalCachedVersions > 1) {
    rows.push([t('settings.cache.label.totalVersions'), t('settings.cache.value.versionCount').replace('{n}', String(info.totalCachedVersions))]);
  }

  box.innerHTML = rows.map(([label, value]) =>
    `<div class="cache-row"><span class="cache-label">${label}</span><span class="cache-value">${value}</span></div>`
  ).join('');
}

async function loadCacheInfo() {
  try {
    const result = await window.electronAPI.getUpdateCacheInfo();
    if (result && result.success) {
      renderCacheInfo(result.info);
    } else {
      renderCacheInfo(null);
      if (result && result.error) {
        showToast(t('settings.toast.cacheReadFailed') + result.error);
      }
    }
  } catch (err) {
    console.error('加载缓存信息失败:', err);
    renderCacheInfo(null);
  }
}

async function handleClearCache() {
  if (isDevEnvironment) {
    showToast(t('settings.devLock.cacheLocked'), 'info', 3000);
    return;
  }

  // 先读一次看看有没有缓存
  let hasCache = false;
  try {
    const r = await window.electronAPI.getUpdateCacheInfo();
    hasCache = !!(r && r.success && r.info && r.info.hasCache);
  } catch (e) {}

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

  const btn = document.getElementById('clearCacheBtn');
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = t('settings.cache.clearing'); }

  try {
    const result = await window.electronAPI.clearUpdateCache();
    if (result && result.success) {
      showToast(t('settings.toast.cacheCleared'));
      await loadCacheInfo();
    } else {
      showToast(t('settings.toast.cacheClearFailed') + (result ? result.error : t('settings.toast.unknownError')));
    }
  } catch (err) {
    console.error('删除缓存失败:', err);
    showToast(t('settings.toast.cacheClearPermission'));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }
}

// ==================== 缓存区：保留天数选择（成功打开后保留 X 天，7~30，默认 7）====================
const RETENTION_MIN = 7;
const RETENTION_MAX = 30;
const RETENTION_DEFAULT = 7;

let currentRetentionDays = RETENTION_DEFAULT;
let retentionSaveTimer = null;

// 规范化天数：夹到 [MIN, MAX]，整数
function clampRetentionDays(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return RETENTION_DEFAULT;
  return Math.max(RETENTION_MIN, Math.min(RETENTION_MAX, Math.round(n)));
}

// 更新「当前：X 天」文本，可选带弹跳动画
function updateRetentionCurrentLabel(days, animate = false) {
  const label = document.getElementById('cacheRetentionCurrent');
  if (!label) return;
  const safeDays = clampRetentionDays(days);
  label.textContent = t('fmt.days.count').replace('{n}', String(safeDays));
  if (animate) {
    label.classList.remove('bump');
    // 强制 reflow 触发动画
    void label.offsetWidth;
    label.classList.add('bump');
  }
}

// 根据传入的天数，同步刷新 UI：快捷按钮高亮、滑杆 value、当前文本
function applyRetentionUI(days, animate = false) {
  const safeDays = clampRetentionDays(days);
  currentRetentionDays = safeDays;

  // 滑杆
  const slider = document.getElementById('cacheRetentionSlider');
  if (slider && Number(slider.value) !== safeDays) {
    slider.value = String(safeDays);
  }

  // 快捷按钮 active
  const presets = document.querySelectorAll('#cacheRetentionPresets .retention-preset');
  presets.forEach(btn => {
    const d = Number(btn.dataset.days);
    btn.classList.toggle('active', d === safeDays);
  });

  updateRetentionCurrentLabel(safeDays, animate);
}

// 保存到主进程配置（滑杆拖动时防抖 250ms 再提交，避免高频 IPC）
async function saveRetentionDays(days, immediate = false) {
  if (!window.electronAPI || !window.electronAPI.setCacheRetentionDays) return;
  const safeDays = clampRetentionDays(days);

  if (retentionSaveTimer) {
    clearTimeout(retentionSaveTimer);
    retentionSaveTimer = null;
  }

  const doSave = async () => {
    retentionSaveTimer = null;
    try {
      const result = await window.electronAPI.setCacheRetentionDays(safeDays);
      if (result && result.success) {
        // 保存后按新策略刷新一次 remainingDays（可能立即有清理导致变化）
        await loadCacheInfo();
        showToast(t('settings.toast.retentionSaved').replace('{days}', String(result.days)));
      } else if (result && result.error) {
        showToast(t('settings.toast.saveFailedPrefix') + result.error);
      }
    } catch (err) {
      console.error('保存保留天数失败:', err);
      showToast(t('settings.toast.saveFailed'));
    }
  };

  if (immediate) {
    await doSave();
  } else {
    retentionSaveTimer = setTimeout(doSave, 250);
  }
}

// 从主进程读取当前配置并应用到 UI
async function loadCacheRetentionDays() {
  if (!window.electronAPI || !window.electronAPI.getCacheRetentionDays) return;
  try {
    const result = await window.electronAPI.getCacheRetentionDays();
    const days = result && Number.isFinite(result.days) ? result.days : RETENTION_DEFAULT;
    applyRetentionUI(days, false);
  } catch (err) {
    console.error('加载保留天数配置失败:', err);
    applyRetentionUI(RETENTION_DEFAULT, false);
  }
}

// ==================== 缓存区：开发环境锁定 + 事件绑定 ====================
function applyCacheDevLock() {
  const refreshBtn = document.getElementById('refreshCacheBtn');
  const clearBtn = document.getElementById('clearCacheBtn');
  const presets = document.querySelectorAll('#cacheRetentionPresets .retention-preset');
  const slider = document.getElementById('cacheRetentionSlider');
  const section = document.getElementById('updateCacheSection');

  if (!section) return;

  if (isDevEnvironment) {
    // 开发环境：按钮禁用，section 半透明提示
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = t('settings.devLock.refreshBtn');
      refreshBtn.title = t('settings.devLock.refreshBtnTitle');
    }
    if (clearBtn) {
      clearBtn.disabled = true;
      clearBtn.textContent = t('settings.devLock.clearBtn');
      clearBtn.title = t('settings.devLock.clearBtnTitle');
      clearBtn.style.opacity = '0.75';
    }
    // 禁用天数选择
    presets.forEach(btn => { btn.disabled = true; });
    if (slider) { slider.disabled = true; }
    // 提示行
    const box = document.getElementById('cacheInfo');
    if (box && !box.dataset.devHinted) {
      box.dataset.devHinted = '1';
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
      refreshBtn.title = '';
    }
    if (clearBtn) {
      clearBtn.disabled = false;
      clearBtn.textContent = t('settings.cache.clearBtn');
      clearBtn.title = '';
      clearBtn.style.opacity = '';
    }
    // 启用天数选择
    presets.forEach(btn => { btn.disabled = false; });
    if (slider) { slider.disabled = false; }
  }
}

function bindCacheEvents() {
  const refreshBtn = document.getElementById('refreshCacheBtn');
  const clearBtn = document.getElementById('clearCacheBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', loadCacheInfo);
  if (clearBtn)   clearBtn.addEventListener('click', handleClearCache);

  // 快捷按钮点击：立即保存
  const presets = document.querySelectorAll('#cacheRetentionPresets .retention-preset');
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const days = Number(btn.dataset.days);
      applyRetentionUI(days, true);
      saveRetentionDays(days, true);
    });
  });

  // 滑杆拖动：实时同步 UI，防抖保存
  const slider = document.getElementById('cacheRetentionSlider');
  if (slider) {
    slider.addEventListener('input', () => {
      if (slider.disabled) return;
      const days = Number(slider.value);
      applyRetentionUI(days, false);
      saveRetentionDays(days, false);
    });
    // 松开时（change）确保再写一次，避免用户快速拖动后 IPC 还没触发就切走
    slider.addEventListener('change', () => {
      if (slider.disabled) return;
      const days = Number(slider.value);
      applyRetentionUI(days, true);
      saveRetentionDays(days, true);
    });
  }
}

// ==================== 更新配置：导入/导出（文件级备份还原）====================
// 开发环境下锁定导入/导出按钮（真实环境才写入用户实际配置）
function applyImportExportDevLock() {
  const exportBtn = document.getElementById('exportUpdaterConfigBtn');
  const importBtn = document.getElementById('importUpdaterConfigBtn');
  if (!exportBtn || !importBtn) return;

  if (isDevEnvironment) {
    exportBtn.disabled = true;
    exportBtn.title = t('settings.devLock.ioBtnTitle');
    exportBtn.textContent = t('settings.devLock.exportBtn');
    exportBtn.style.opacity = '0.75';

    importBtn.disabled = true;
    importBtn.title = t('settings.devLock.ioBtnTitle');
    importBtn.textContent = t('settings.devLock.importBtn');
    importBtn.style.opacity = '0.75';
  } else {
    exportBtn.disabled = false;
    exportBtn.title = '';
    exportBtn.textContent = t('settings.configIO.exportBtn');
    exportBtn.style.opacity = '';

    importBtn.disabled = false;
    importBtn.title = '';
    importBtn.textContent = t('settings.configIO.importBtn');
    importBtn.style.opacity = '';
  }
}

async function handleExportUpdaterConfig() {
  if (!window.electronAPI || !window.electronAPI.exportUpdaterConfig) {
    showToast(t('settings.toast.exportUnsupported'));
    return;
  }
  try {
    const result = await window.electronAPI.exportUpdaterConfig();
    if (!result) {
      showToast(t('settings.toast.exportFailed'));
      return;
    }
    if (result.canceled) return; // 用户点了取消，不提示
    if (result.success && result.filePath) {
      const name = (result.filePath.match(/[^\\/]+$/) || [])[0] || result.filePath;
      showToast(t('settings.toast.exportSuccess').replace('{name}', name));
    } else if (result.error) {
      showToast(t('settings.toast.exportFailedPrefix') + result.error);
    }
  } catch (err) {
    console.error('导出更新配置失败:', err);
    showToast(t('settings.toast.exportFailed'));
  }
}

async function handleImportUpdaterConfig() {
  if (!window.electronAPI || !window.electronAPI.importUpdaterConfig) {
    showToast(t('settings.toast.importUnsupported'));
    return;
  }

  // 先二次确认（避免误点覆盖现有设置）
  const ok = await showCustomConfirm({
    title: t('confirm.importConfig.title'),
    message: t('confirm.importConfig.message'),
    okText: t('confirm.importConfig.ok'),
    cancelText: t('confirm.default.cancel'),
    okDanger: false
  });
  if (!ok) return;

  try {
    const result = await window.electronAPI.importUpdaterConfig();
    if (!result) {
      showToast(t('settings.toast.importFailed'));
      return;
    }
    if (result.canceled) return; // 用户取消选文件

    if (result.success && result.config) {
      // 导入成功：重新加载整页所有控件，保证 UI 与配置一致
      await Promise.all([
        loadUpdaterConfig(),
        loadCacheRetentionDays()
      ]);
      applyImportExportDevLock();
      applyCacheDevLock();
      await loadCacheInfo();
      showToast(t('settings.toast.importSuccess'));
    } else if (result.error) {
      showToast(t('settings.toast.importFailedPrefix') + result.error);
    } else {
      showToast(t('settings.toast.importFailed'));
    }
  } catch (err) {
    console.error('导入更新配置失败:', err);
    showToast(t('settings.toast.importFailed'));
  }
}

function bindImportExportEvents() {
  const exportBtn = document.getElementById('exportUpdaterConfigBtn');
  const importBtn = document.getElementById('importUpdaterConfigBtn');
  if (exportBtn) exportBtn.addEventListener('click', handleExportUpdaterConfig);
  if (importBtn) importBtn.addEventListener('click', handleImportUpdaterConfig);
}

// ==================== 更新器自定义弹窗（替换系统原生 dialog）====================
/**
 * 通用渲染层弹窗：根据主进程传的 dialogType 显示不同 UI，用户点按钮后 IPC 回传
 * @param {string} dialogId 主进程传的唯一 dialogId
 * @param {string} dialogType 弹窗类型
 * @param {object} params 参数（version / errors 等）
 * @param {number} timeoutMs 超时毫秒（0=无超时）
 */
function showUpdaterDialog(dialogId, dialogType, params, timeoutMs = 0) {
  const modalEl = document.getElementById('updaterDialogModal');
  const titleEl = document.getElementById('updaterDialogTitle');
  const bodyEl = document.getElementById('updaterDialogBody');
  const buttonsEl = document.getElementById('updaterDialogButtons');
  if (!modalEl || !titleEl || !bodyEl || !buttonsEl) return;

  let title = '';
  let bodyHtml = '';
  const buttons = []; // [{label, style: 'ok'|'cancel'|'default', actionFn: () => sendResponse(idx)}]
  const sendResponse = async (buttonIndex, extra = {}) => {
    modalEl.style.display = 'none';
    if (window.electronAPI && window.electronAPI.sendUpdateDialogResponse) {
      try {
        await window.electronAPI.sendUpdateDialogResponse(dialogId, { buttonIndex, ...extra });
      } catch (err) {
        console.warn('sendUpdateDialogResponse failed:', err);
      }
    }
  };

  const { shell } = require('electron'); // 浏览器环境不会有，这里用 window.electronAPI.openOfficialSite
  const openExternal = (url) => {
    if (window.electronAPI && window.electronAPI.invoke) {
      window.electronAPI.invoke('app:open-external', url).catch(() => {});
    } else if (params && params.releaseUrl) {
      // 兜底：通过 openOfficialSite 无法精确跳转时，直接复制链接到剪贴板
      try { navigator.clipboard && navigator.clipboard.writeText(url); } catch (_) {}
    }
  };

  switch (dialogType) {
    // ========== 1. 发现新版本（双按钮）==========
    case 'update-confirm': {
      title = t('dialog.updateConfirm.title');
      bodyHtml = `
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.newVersion')}:</b> ${escapeHtml(params.newVersion || '')}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.codename')}:</b> ${escapeHtml(params.codename || '')}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.releaseDate')}:</b> ${escapeHtml(params.releaseDate || '')}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.hashPrefix')}:</b> ${escapeHtml(params.hashPrefix || '—')}</div>
        <div class="upd-info-row"><b>${t('dialog.updateConfirm.currentVersion')}:</b> ${escapeHtml(params.currentVersion || '')}</div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.updateConfirm.ask')}</div>
      `;
      buttons.push({ index: 1, label: t('dialog.updateConfirm.btnLater'), style: 'cancel' });
      buttons.push({ index: 0, label: t('dialog.updateConfirm.btnUpdate'), style: 'ok' });
      break;
    }
    // ========== 2. 仅提醒（单按钮 + 打开官网）==========
    case 'notify-only': {
      title = t('dialog.notifyOnly.title');
      const url = params.releaseUrl || '';
      bodyHtml = `
        <div class="upd-info-row"><b>${t('dialog.notifyOnly.newVersion')}:</b> ${escapeHtml(params.newVersion || '')}</div>
        <div class="upd-info-row"><b>${t('dialog.notifyOnly.codename')}:</b> ${escapeHtml(params.codename || '')}</div>
        <div class="upd-info-row"><b>${t('dialog.notifyOnly.releaseDate')}:</b> ${escapeHtml(params.releaseDate || '')}</div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.notifyOnly.tip')}</div>
        <div class="upd-info-row upd-url-box" style="word-break:break-all;background:#f6f6f6;padding:8px 10px;border-radius:6px;margin-top:6px;">
          <a href="${escapeHtml(url)}" target="_blank" data-open-external="${escapeHtml(url)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(url)}</a>
        </div>
      `;
      buttons.push({ index: 0, label: t('dialog.notifyOnly.btnGotIt'), style: 'ok' });
      break;
    }
    // ========== 3. 重启确认（双按钮 + 30s 超时倒计时）==========
    case 'restart-confirm': {
      title = t('dialog.restartConfirm.title');
      bodyHtml = `
        <div class="upd-info-row"><b>${t('dialog.restartConfirm.version')}:</b> ${escapeHtml(params.targetVersion || '')}</div>
        <div class="upd-info-row"><b>${t('dialog.restartConfirm.codename')}:</b> ${escapeHtml(params.codename || '')}</div>
        <div class="upd-info-row"><b>${t('dialog.restartConfirm.releaseDate')}:</b> ${escapeHtml(params.releaseDate || '')}</div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.restartConfirm.ask')}</div>
        <div id="restartCountdown" class="upd-info-row" style="margin-top:8px;color:#666;font-size:13px;"></div>
      `;
      buttons.push({ index: 1, label: t('dialog.restartConfirm.btnLater'), style: 'cancel' });
      buttons.push({ index: 0, label: t('dialog.restartConfirm.btnRestart'), style: 'ok' });

      // 30s 倒计时显示
      if (timeoutMs > 0) {
        let remaining = Math.round(timeoutMs / 1000);
        const timerId = setInterval(() => {
          remaining -= 1;
          const cdEl = document.getElementById('restartCountdown');
          if (cdEl) {
            cdEl.textContent = t('dialog.restartConfirm.countdown', { seconds: remaining });
          }
          if (remaining <= 0) {
            clearInterval(timerId);
          }
          if (!document.getElementById('updaterDialogModal') || document.getElementById('updaterDialogModal').style.display === 'none') {
            clearInterval(timerId);
          }
        }, 1000);
        const cdEl = document.getElementById('restartCountdown');
        if (cdEl) cdEl.textContent = t('dialog.restartConfirm.countdown', { seconds: remaining });
      }
      break;
    }
    // ========== 4. 回滚-有缓存（三按钮）==========
    case 'rollback-with-cache': {
      title = t('dialog.rollbackCache.title');
      const errs = Array.isArray(params.errors) ? params.errors : [];
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.rollbackCache.intro')}</div>
        <div class="upd-info-row" style="margin-top:10px;background:#ecfdf5;padding:8px 10px;border-radius:6px;border:1px solid #10b981;color:#065f46;">
          ✅ ${t('dialog.rollbackCache.cacheAvailable', { version: params.version || '' })}
        </div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.rollbackCache.ask')}</div>
        ${errs.length > 0 ? `
          <details style="margin-top:10px;"><summary style="cursor:pointer;color:#666;">${t('dialog.rollbackCache.errorsLabel')}</summary>
            <pre style="margin:6px 0 0;padding:8px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;white-space:pre-wrap;word-break:break-all;font-size:12px;">${escapeHtml(errs.join('\n'))}</pre>
          </details>` : ''}
      `;
      buttons.push({ index: 2, label: t('dialog.rollbackCache.btnLater'), style: 'cancel' });
      buttons.push({ index: 1, label: t('dialog.rollbackCache.btnOfficial'), style: 'default', onClick: () => { params.releaseUrl && openExternal(params.releaseUrl); } });
      buttons.push({ index: 0, label: t('dialog.rollbackCache.btnRollback'), style: 'ok' });
      break;
    }
    // ========== 5. 回滚-重启确认（双按钮）==========
    case 'rollback-restart': {
      title = t('dialog.rollbackRestart.title');
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.rollbackRestart.ready', { version: params.version || '' })}</div>
        <div class="upd-info-row" style="margin-top:10px;">${t('dialog.rollbackRestart.ask')}</div>
      `;
      buttons.push({ index: 1, label: t('dialog.rollbackRestart.btnLater'), style: 'cancel' });
      buttons.push({ index: 0, label: t('dialog.rollbackRestart.btnRestart'), style: 'ok' });
      break;
    }
    // ========== 6. 回滚-无缓存（双按钮 + 错误详情）==========
    case 'rollback-no-cache': {
      title = t('dialog.rollbackNoCache.title');
      const errs = Array.isArray(params.errors) ? params.errors : [];
      const url = params.releaseUrl || '';
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.rollbackNoCache.intro')}</div>
        <div class="upd-info-row" style="margin-top:10px;background:#fef2f2;padding:8px 10px;border-radius:6px;border:1px solid #ef4444;color:#7f1d1d;">
          ⚠️ ${t('dialog.rollbackNoCache.noCacheTip')}
        </div>
        <div class="upd-info-row" style="margin-top:12px;">${t('dialog.rollbackNoCache.downloadTip')}</div>
        <div class="upd-info-row upd-url-box" style="word-break:break-all;background:#f6f6f6;padding:8px 10px;border-radius:6px;margin-top:6px;">
          <a href="${escapeHtml(url)}" target="_blank" data-open-external="${escapeHtml(url)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(url)}</a>
        </div>
        ${errs.length > 0 ? `
          <details style="margin-top:10px;"><summary style="cursor:pointer;color:#666;">${t('dialog.rollbackNoCache.errorsLabel')}</summary>
            <pre style="margin:6px 0 0;padding:8px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;white-space:pre-wrap;word-break:break-all;font-size:12px;">${escapeHtml(errs.join('\n'))}</pre>
          </details>` : ''}
      `;
      buttons.push({ index: 1, label: t('dialog.rollbackNoCache.btnOk'), style: 'cancel' });
      buttons.push({ index: 0, label: t('dialog.rollbackNoCache.btnOfficial'), style: 'ok', onClick: () => openExternal(url) });
      break;
    }
    // ========== 7. 手动更新失败（单按钮）==========
    case 'manual-update-failed': {
      title = t('dialog.manualFailed.title');
      bodyHtml = `
        <div class="upd-info-row">${t('dialog.manualFailed.tip')}</div>
        <div class="upd-info-row" style="margin-top:10px;background:#fef2f2;padding:8px 10px;border-radius:6px;border:1px solid #ef4444;color:#7f1d1d;word-break:break-all;">
          ${escapeHtml(params.error || '')}
        </div>
      `;
      buttons.push({ index: 0, label: t('dialog.manualFailed.btnOk'), style: 'ok' });
      break;
    }
    // ========== 8. simple-error（通用简单错误）==========
    case 'simple-error':
    default: {
      title = t(params.titleKey || 'dialog.simpleError.title');
      bodyHtml = `
        <div class="upd-info-row">${t(params.bodyKey || 'dialog.simpleError.body')}</div>
        ${params.detail ? `<div class="upd-info-row" style="margin-top:10px;font-size:12px;color:#666;word-break:break-all;">${escapeHtml(params.detail)}</div>` : ''}
      `;
      buttons.push({ index: 0, label: t('dialog.simpleError.btnOk'), style: 'ok' });
      break;
    }
  }

  // 应用标题/内容
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;

  // 处理链接打开外部（通过主进程 shell.openExternal）
  bodyEl.querySelectorAll('[data-open-external]').forEach((a) => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const u = a.getAttribute('data-open-external');
      if (u) openExternal(u);
    });
  });

  // 渲染按钮
  buttonsEl.innerHTML = '';
  buttons.sort((a, b) => a.index - b.index).forEach((btn) => {
    const b = document.createElement('button');
    b.className = 'custom-confirm-btn ' + (btn.style || 'default');
    b.textContent = btn.label;
    b.addEventListener('click', () => {
      if (typeof btn.onClick === 'function') {
        try { btn.onClick(); } catch (_) {}
      }
      sendResponse(btn.index);
    });
    buttonsEl.appendChild(b);
  });

  // 显示
  modalEl.style.display = 'flex';
}

function bindUpdaterDialogListener() {
  if (!window.electronAPI || !window.electronAPI.onUpdateDialogShow) return;
  window.electronAPI.onUpdateDialogShow(({ dialogId, dialogType, params, timeoutMs }) => {
    console.log('[Settings] Received updater dialog show:', { dialogId, dialogType, params });
    showUpdaterDialog(dialogId, dialogType, params || {}, timeoutMs || 0);
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ==================== 初始化更新配置（追加缓存 section 初始化）====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadUpdaterConfig();
  bindUpdaterEvents();
  bindToastListener();
  // 新增：更新器自定义弹窗监听
  bindUpdaterDialogListener();
  // 新增：缓存区初始化（先读保留天数配置，再应用开发锁定、事件、加载缓存信息）
  await loadCacheRetentionDays();
  applyImportExportDevLock();
  applyCacheDevLock();
  bindCacheEvents();
  bindImportExportEvents();
  await loadCacheInfo();
});

// 配置变化时，重新应用一次开发环境锁定（确保 isDev 一致）
window.electronAPI.on && window.electronAPI.on('config:changed', () => {
  applyImportExportDevLock();
  applyCacheDevLock();
});