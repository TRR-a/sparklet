// Update flow: report stage decision to the caller [更新流程 - 把阶段决策回报给调用方]

import type { NetworkErrorType } from 'sparklet/shared/types/updater/updater.js';
import { formatFriendlyUpdateError } from 'sparklet/main/updater/dialog/dialog.js';
import type { CompleteCallback } from 'sparklet/main/updater/dialog/dialog.js';
import type { FlowDecision, FlowStage } from 'sparklet/main/updater/flow/stages/update-flow-stage-result.js';

/** Report a stage decision to the caller [把阶段决策回报给调用方] */
export function reportDecision(
  decision: FlowDecision,
  onComplete: CompleteCallback | null
): void {
  if (decision.kind === 'success') {
    onComplete && onComplete(true, null);
    return;
  }
  if (decision.kind === 'error') {
    if (decision.friendly) {
      const friendly = formatFriendlyUpdateError(
        decision.error,
        decision.errorType as NetworkErrorType | null,
        (decision.stage ?? 'check') as FlowStage
      );
      onComplete && onComplete(false, decision.error, friendly);
    } else {
      onComplete && onComplete(false, decision.error);
    }
  }
}
