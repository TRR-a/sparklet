// Command-line update disable flags [命令行禁用更新标志]

import { DISABLE_UPDATE_FLAGS } from './constants.js';
import { updaterStateInternal } from './update-state.js';

/**
 * Check CLI flags that disable updates [检查禁用更新的命令行标志]
 */
export function checkDisableFlags(): boolean {
  const args = process.argv;
  updaterStateInternal.updateDisabled = DISABLE_UPDATE_FLAGS.some(flag => args.includes(flag));
  if (updaterStateInternal.updateDisabled) {
    console.log('[Updater] Update disabled via command line flag');
  }
  return updaterStateInternal.updateDisabled;
}
