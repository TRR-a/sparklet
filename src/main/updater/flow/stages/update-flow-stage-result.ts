// Update flow: stage result interpretation [更新流程 - 阶段结果解释]

import type { ManifestEntry } from 'sparklet/shared/types/updater/updater.js';
import type { PrepareOutcome } from '../prepare/update-flow-prepare.js';
import type { InstallStageResult } from '../update-flow-install.js';

/** Friendly-error stage names [友好错误提示的阶段名] */
export type FlowStage = 'check' | 'download-manifest' | 'download-zip' | 'verify' | 'install';

/** What the orchestrator should do next [编排器接下来该做什么] */
export type FlowDecision =
  | { kind: 'continue'; tempDir: string; isManualDir: boolean; zipPath: string; entry: ManifestEntry }
  | { kind: 'success' }
  | { kind: 'error'; error: string | null; errorType: string | null; stage: FlowStage | null; friendly: boolean };

/** Map the prepare outcome to the orchestrator decision [把准备阶段结果映射为编排决策] */
export function interpretPrepare(prepared: PrepareOutcome): FlowDecision {
  switch (prepared.status) {
    case 'manifest-failed':
      return { kind: 'error', error: prepared.error, errorType: null, stage: 'download-manifest', friendly: true };
    case 'cancelled':
      console.log('[Updater] User cancelled update');
      return { kind: 'success' };
    case 'temp-failed':
      return { kind: 'error', error: 'Unable to acquire temp directory', errorType: null, stage: null, friendly: false };
    case 'download-failed':
      return { kind: 'error', error: prepared.error, errorType: prepared.errorType, stage: 'download-zip', friendly: true };
    case 'integrity-failed':
      return { kind: 'error', error: prepared.error, errorType: prepared.errorType, stage: 'verify', friendly: true };
    case 'ok':
      return {
        kind: 'continue',
        tempDir: prepared.tempDir,
        isManualDir: prepared.isManualDir,
        zipPath: prepared.zipPath,
        entry: prepared.entry,
      };
  }
}

/** Map the install stage outcome to the orchestrator decision [把安装阶段结果映射为编排决策] */
export function interpretInstall(stage: InstallStageResult): FlowDecision {
  switch (stage.status) {
    case 'later':
      return { kind: 'success' };
    case 'failed':
      return { kind: 'error', error: stage.error, errorType: null, stage: 'install', friendly: true };
    case 'installed':
      return { kind: 'success' };
  }
}
