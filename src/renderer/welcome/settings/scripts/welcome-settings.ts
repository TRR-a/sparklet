// Kernel settings window renderer [内核设置窗口渲染层]
// Standalone settings window for kernel-level preferences (theme, language,
// clock format), with an About panel and tools. Changes persist via storeApi
// and sync to every window via broadcastApi.
// [内核级偏好设置 (主题、语言、时钟制式) 的独立设置窗口，含关于面板与工具。
//  变更经 storeApi 持久化并通过 broadcastApi 同步到所有窗口]
//
// i18n → welcome-settings-i18n.ts, custom select → welcome-settings-select.ts,
// window controls → welcome-settings-window.ts,
// saved prefs → welcome-settings-init-state.ts, selects → welcome-settings-select-bindings.ts,
// tools → welcome-settings-tools.ts, broadcasts → welcome-settings-broadcast.ts

import { initCustomTooltip } from 'sparklet/renderer/shared/index.js';
import { t } from './welcome-settings-i18n.js';
import { bindWindowControls } from './welcome-settings-window.js';
import { loadSavedSettings } from './welcome-settings-init-state.js';
import { bindSettingsSelects, bindClockToggle } from './welcome-settings-select-bindings.js';
import { bindToolButtons } from './welcome-settings-tools.js';
import { bindBroadcastSync } from './welcome-settings-broadcast.js';

// ========== Init ==========
async function init(): Promise<void> {
  bindWindowControls();
  initCustomTooltip((key) => t(key));

  // Disable text copy / context menu - settings page has no copyable content [禁止复制/右键 - 设置页无可复制内容]
  document.addEventListener('copy', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  try {
    const clockToggle = await loadSavedSettings();

    bindSettingsSelects();
    bindClockToggle(clockToggle);
    bindToolButtons();
    bindBroadcastSync(clockToggle);
  } catch (err) {
    console.error('[WelcomeSettings] init error:', err);
  }
}

void init();
