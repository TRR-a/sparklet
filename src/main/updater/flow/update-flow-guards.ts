// Update flow: preflight guards [更新流程 - 前置守卫]

import { getUpdateBehavior } from '../config/config-manager.js';
import type { CompleteCallback } from '../dialog/dialog.js';
import { updaterStateInternal } from '../startup/update-state.js';

/** Behavior value returned by the config [配置返回的更新行为值] */
export type UpdateBehavior = Awaited<ReturnType<typeof getUpdateBehavior>>;

/** Preflight outcome: stop the flow or continue with the behavior [前置结果：中止流程，或带行为继续] */
export type PreflightResult =
  | { proceed: false; success: boolean }
  | { proceed: true; behavior: UpdateBehavior };

/**
 * Check "disabled" guards before touching the network [联网前检查"已禁用"类守卫]
 */
export async function runUpdatePreflight(onComplete: CompleteCallback | null): Promise<PreflightResult> {
  if (updaterStateInternal.updateDisabled) {
    console.log('[Updater] Update disabled, skipping');
    onComplete && onComplete(false, 'Update disabled');
    return { proceed: false, success: false };
  }

  const updateBehavior = await getUpdateBehavior();
  if (updateBehavior === 'disabled') {
    console.log('[Updater] User disabled updates');
    onComplete && onComplete(true, null);
    return { proceed: false, success: true };
  }

  return { proceed: true, behavior: updateBehavior };
}
