// Update flow: prepare stage [更新流程 - 准备阶段]

import type { ProgressCallback, CompleteCallback } from '../../dialog/dialog.js';
import { prepareUpdatePackage } from '../prepare/update-flow-prepare.js';
import { interpretPrepare } from './update-flow-stage-result.js';
import { reportDecision } from '../update-flow-report.js';
import type { FlowArtifacts, InstallPhaseInput } from './update-flow-stages-types.js';

/** Decision after a successful prepare, carrying the staged entry [准备成功后的判定，含已就绪的入口] */
export type PrepareOutcome = Extract<ReturnType<typeof interpretPrepare>, { kind: 'continue' }>;

/**
 * Prepare the package; artifacts are published as soon as prepare succeeds
 * [准备安装包；准备成功即刻公开清理用产物]
 * @returns continue decision, or null when the flow already ended here [continue 判定；流程就此结束则 null]
 */
export async function runPreparePhase(
  input: InstallPhaseInput,
  onProgress: ProgressCallback | null,
  onComplete: CompleteCallback | null,
  assignArtifacts: (artifacts: FlowArtifacts) => void
): Promise<PrepareOutcome | null> {
  const prepared = await prepareUpdatePackage({
    currentVersion: input.currentVersion,
    latestVersion: input.latestVersion,
    zipUrl: input.zipUrl,
    manifestUrl: input.manifestUrl,
    onProgress: onProgress ?? undefined,
  });
  const prepareDecision = interpretPrepare(prepared);
  if (prepareDecision.kind !== 'continue') {
    reportDecision(prepareDecision, onComplete);
    return null;
  }

  assignArtifacts({
    zipPath: prepareDecision.zipPath,
    tempDir: prepareDecision.tempDir,
    isManualDir: prepareDecision.isManualDir,
  });
  return prepareDecision;
}
