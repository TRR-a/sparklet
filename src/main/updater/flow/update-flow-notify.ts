// Update flow: notify-only branch [更新流程 - 仅提醒分支]

import { verifyReleaseManifest } from 'sparklet/main/updater/install/verify.js';
import { setConfigItem } from 'sparklet/main/updater/config/config-manager.js';
import { promptRendererDialog, showNotifyOnlyDialog } from 'sparklet/main/updater/dialog/dialog.js';

/**
 * Notify-only mode: show release info without downloading [仅提醒模式：只展示发布信息，不下载]
 */
export async function runNotifyOnlyBranch(
  currentVersion: string,
  latestVersion: string,
  manifestUrl: string | null
): Promise<void> {
  const releaseUrl = `https://github.com/TRR-a/sparklet/releases/tag/v${latestVersion}`;
  const manifestResult = await verifyReleaseManifest(manifestUrl!, `v${latestVersion}`);
  if (manifestResult.success && manifestResult.entry) {
    await showNotifyOnlyDialog(currentVersion, manifestResult.entry, releaseUrl);
  } else {
    await promptRendererDialog('notify-only', {
      newVersion: `v${latestVersion}`,
      codename: 'N/A',
      releaseDate: 'N/A',
      releaseUrl
    });
  }
  await setConfigItem('lastCheckTime', new Date().toISOString());
}
