// Update module entry point [更新模块入口]
// Disable flags in updater-disable-flags.ts, initialization in updater-init.ts [禁用标志在 updater-disable-flags.ts，初始化在 updater-init.ts]

import { updaterStateInternal } from './update-state.js';

export { initUpdater, applyDevConfigOverride } from './updater-init.js';
export { checkDisableFlags } from './updater-disable-flags.js';
export {
  checkUpdateManually,
  checkPendingUpdate,
  autoCheckUpdate,
} from './update-timer.js';
export { performUpdate } from './update-flow.js';

export const updaterState = {
  get isUpdating() { return updaterStateInternal.isUpdating; },
  get pendingUpdate() { return updaterStateInternal.pendingUpdate; },
  get updateDisabled() { return updaterStateInternal.updateDisabled; },
  get isChecking() { return updaterStateInternal.isChecking; }
};
