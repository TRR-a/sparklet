// Update flow: prepare - temp directory [更新流程 - 准备：临时目录]

import { acquireTempDir } from 'sparklet/main/updater/temp/temp-manager.js';
import { promptRendererDialog } from 'sparklet/main/updater/dialog/dialog.js';

/** Result of the temp-directory step [临时目录步骤结果] */
export type TempDirResult =
  | { status: 'temp-failed' }
  | { status: 'ok'; tempDir: string; isManualDir: boolean };

/** Acquire a usable temp directory (prompting on errors) [获取可用的临时目录 (出错时弹窗)] */
export async function runTempDirStep(
  onProgress?: (msg: string, percent: number) => void
): Promise<TempDirResult> {
  onProgress && onProgress('Preparing temp directory...', 5);
  const tempResult = await acquireTempDir({
    showTempDirError: async () => {
      const res = await promptRendererDialog('temp-dir-error', {}, { fallbackResponse: { buttonIndex: 2 } });
      return res.buttonIndex;
    },
    showDirNotEmptyConfirm: async () => {
      const res = await promptRendererDialog('temp-dir-not-empty', {}, { fallbackResponse: { buttonIndex: 1 } });
      return res.buttonIndex;
    }
  });
  if (!tempResult.success) {
    return { status: 'temp-failed' };
  }
  const tempDir = tempResult.path!;
  const isManualDir = tempResult.isManual;
  console.log('[Updater] Using temp directory:', tempDir);
  return { status: 'ok', tempDir, isManualDir };
}
