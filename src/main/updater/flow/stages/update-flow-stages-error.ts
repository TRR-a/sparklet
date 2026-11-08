// Update flow: unexpected failure handling [更新流程 - 异常失败处理]

import { formatFriendlyUpdateError } from '../../dialog/dialog.js';
import type { CompleteCallback } from '../../dialog/dialog.js';
import { cleanupUpdateArtifacts } from '../update-flow-cleanup.js';
import type { FlowArtifacts } from './update-flow-stages-install.js';

/** Clean up artifacts, report the raw + friendly error, and clear the updating flag [清理产物、回报原始与友好错误并复位更新标记] */
export async function handleFlowError(
  err: unknown,
  artifacts: FlowArtifacts,
  onComplete: CompleteCallback | null,
  clearUpdating: () => void
): Promise<void> {
  const rawErr = err instanceof Error ? err.message : String(err);
  console.error('[Updater] Update process error:', err);
  await cleanupUpdateArtifacts(artifacts.zipPath, artifacts.tempDir, artifacts.isManualDir);
  clearUpdating();
  const friendly = formatFriendlyUpdateError(rawErr, null, 'check');
  onComplete && onComplete(false, rawErr, friendly);
}
