// Settings: bind updater section events [设置 - 绑定更新区事件]
//
// Split out [已拆分]：controls → updater-config-events-bind.ts,
// status/progress → updater-config-events-status.ts,
// external config change → updater-config-events-changed.ts.

import { bindUpdaterControls } from 'sparklet/renderer/app/settings/updater/scripts/updater-config-events-bind.js';
import { bindUpdaterStatusEvents } from 'sparklet/renderer/app/settings/updater/scripts/updater-config-events-status.js';
import { bindUpdaterConfigChanged } from 'sparklet/renderer/app/settings/updater/scripts/updater-config-events-changed.js';

/**
 * Bind updater event listeners [绑定更新模块事件监听]
 */
export function bindUpdaterEvents(): void {
  bindUpdaterControls();
  bindUpdaterStatusEvents();
  bindUpdaterConfigChanged();
}
