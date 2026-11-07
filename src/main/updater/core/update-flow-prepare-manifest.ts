// Update flow: prepare - manifest & user confirmation [更新流程 - 准备：清单与用户确认]

import type { ManifestEntry } from 'sparklet/shared/types/updater';
import { verifyReleaseManifest } from './verify.js';
import { showUpdateDialog } from '../dialog/dialog.js';

/** Result of the manifest/confirm step [清单与确认步骤结果] */
export type ManifestConfirmResult =
  | { status: 'manifest-failed'; error: string | null }
  | { status: 'cancelled' }
  | { status: 'ok'; entry: ManifestEntry };

/** Verify the release manifest and ask the user to confirm [校验发布清单并请用户确认] */
export async function runManifestConfirmStep(
  currentVersion: string,
  latestVersion: string,
  manifestUrl: string | null,
  onProgress?: (msg: string, percent: number) => void
): Promise<ManifestConfirmResult> {
  onProgress && onProgress('Fetching update metadata...', 3);
  const manifestResult = await verifyReleaseManifest(manifestUrl!, `v${latestVersion}`);
  if (!manifestResult.success) {
    return { status: 'manifest-failed', error: manifestResult.error };
  }
  const entry = manifestResult.entry!;

  const confirmResult = await showUpdateDialog(currentVersion, entry);
  const userConfirmed = confirmResult.buttonIndex === 0;
  if (!userConfirmed) {
    console.log('[Updater] User cancelled update');
    return { status: 'cancelled' };
  }

  return { status: 'ok', entry };
}
