// Update flow: stage exit helpers [更新流程 - 阶段退出辅助]

import { setConfigItem } from './config-manager.js';
import { updaterStateInternal } from './update-state.js';

/** Clear the in-flight flag and return [清除进行中标记并返回] */
export function stopFlow(): void {
  updaterStateInternal.isUpdating = false;
}

/** Clear the flag, then record the check time [清除标记后记录检查时间] */
export async function markUpToDate(): Promise<void> {
  updaterStateInternal.isUpdating = false;
  await setConfigItem('lastCheckTime', new Date().toISOString());
}
