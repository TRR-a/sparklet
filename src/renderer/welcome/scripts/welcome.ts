// Kernel renderer: the microkernel Hub UI [内核渲染层：微内核 Hub 界面]
// Applies the app theme (light/dark/blue), wires window controls and opens the
// official windows (Main, settings, about) on demand.
// [应用主题 (light/dark/blue)、绑定窗口控制，并按需打开官方窗口
// (Main、设置、关于)]
//
// Pieces split out [已拆分]：i18n → welcome-i18n.ts, theme → welcome-theme.ts,
// window controls → welcome-window-controls.ts, monitor → welcome-monitor.ts,
// log card → welcome-log-card.ts, clock → welcome-clock.ts,
// exit dialog → welcome-exit-dialog.ts, more menu → welcome-more-menu.ts,
// tabs → welcome-tabs.ts, bootstrap steps → welcome-init-*.ts

import { logApi, installGlobalErrorHooks } from '../../shared/index.js';
import { initLanguage } from '../init/scripts/welcome-init-language.js';
import { initClockFormat } from '../init/scripts/welcome-init-clock.js';
import { bindBodyStateEvents } from '../init/scripts/welcome-init-body-events.js';
import { bindWelcomeChrome } from '../init/scripts/welcome-init-chrome.js';
import { applyFirstLaunchGreeting } from '../init/scripts/welcome-init-greeting.js';
import { initTabs } from '../tabs/scripts/welcome-tabs.js';

async function init(): Promise<void> {
  // Uncaught errors/rejections go to the log file before anything else
  // [任何逻辑执行前先装好未捕获错误/拒绝的日志转发]
  installGlobalErrorHooks('hub.welcome');

  await initLanguage();
  await bindWelcomeChrome();
  await initClockFormat();
  bindBodyStateEvents();
  logApi.info('hub.welcome', 'Renderer ready');

  await applyFirstLaunchGreeting();

  initTabs();
}

void init();
