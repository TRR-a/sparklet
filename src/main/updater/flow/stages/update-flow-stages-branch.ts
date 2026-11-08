// Update flow: settle non-install check outcomes [更新流程 - 处理非安装类检查结果]

import type { CheckPhase } from 'sparklet/main/updater/flow/stages/update-flow-stages-check.js';
import { stopFlow, markUpToDate } from 'sparklet/main/updater/flow/stages/update-flow-stages-exit.js';

/** The only check outcome that continues into install [唯一会继续进入安装的检查结果] */
export type ContinuePhase = Extract<CheckPhase, { kind: 'continue' }>;

/**
 * End the flow for stop / up-to-date / notify-only, or hand back the continue phase
 * [对 stop / up-to-date / notify-only 结束流程；continue 则原样交回]
 */
export async function settleNonContinuePhase(phase: CheckPhase): Promise<ContinuePhase | null> {
  if (phase.kind === 'continue') return phase;
  if (phase.kind === 'up-to-date') {
    await markUpToDate();
    return null;
  }
  stopFlow(); // 'stop' | 'notify-only'
  return null;
}
