// Update flow: prepare stage outcome type [更新流程 - 准备阶段结果类型]

import type { ManifestEntry } from 'sparklet/shared/types/updater/updater.js';

/** Outcome of the prepare stage [准备阶段结果] */
export type PrepareOutcome =
  | { status: 'manifest-failed'; error: string | null }
  | { status: 'cancelled' }
  | { status: 'temp-failed' }
  | { status: 'download-failed'; error: string | null; errorType: string | null }
  | { status: 'integrity-failed'; error: string | null; errorType: string | null }
  | { status: 'ok'; tempDir: string; isManualDir: boolean; zipPath: string; entry: ManifestEntry };
