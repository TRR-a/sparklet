// Update flow: install stage runner [更新流程 - 安装阶段执行]

import type { ProgressCallback, CompleteCallback } from 'sparklet/main/updater/dialog/dialog.js';
import { runInstallStage } from 'sparklet/main/updater/flow/update-flow-install.js';
import { interpretInstall } from 'sparklet/main/updater/flow/stages/update-flow-stage-result.js';
import { reportDecision } from 'sparklet/main/updater/flow/update-flow-report.js';
import { runPreparePhase } from 'sparklet/main/updater/flow/stages/update-flow-stages-prepare.js';
import type { FlowArtifacts, InstallPhaseInput } from 'sparklet/main/updater/flow/stages/update-flow-stages-types.js';

export type { FlowArtifacts, InstallPhaseInput } from 'sparklet/main/updater/flow/stages/update-flow-stages-types.js';

/**
 * Prepare the package then install; artifacts are published as soon as prepare succeeds
 * [先准备安装包再安装；准备成功即刻公开清理用产物]
 * @returns false when the flow already ended at the prepare step [准备阶段即结束时返回 false]
 */
export async function runInstallPhase(
  input: InstallPhaseInput,
  onProgress: ProgressCallback | null,
  onComplete: CompleteCallback | null,
  assignArtifacts: (artifacts: FlowArtifacts) => void
): Promise<boolean> {
  const prepared = await runPreparePhase(input, onProgress, onComplete, assignArtifacts);
  if (!prepared) return false;

  const stage = await runInstallStage({
    latestVersion: input.latestVersion,
    entry: prepared.entry,
    zipPath: prepared.zipPath,
    tempDir: prepared.tempDir,
    isManualDir: prepared.isManualDir,
    onProgress: onProgress ?? undefined,
  });

  reportDecision(interpretInstall(stage), onComplete);
  return true;
}
