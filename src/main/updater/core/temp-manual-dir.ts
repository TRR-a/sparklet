// Temp dir: manual directory pick [临时目录 - 手动选择目录]

import * as fs from 'fs-extra';
import { dialog } from 'electron';
import type { TempDirResult } from 'sparklet/shared/types/updater';
import { cleanDirectory } from './temp-clean.js';
import { askDirNotEmpty, type TempDirDialogs } from './temp-dialogs.js';

/**
 * Pick a directory manually (reselect loops back to acquire) [手动选择目录 (重选则回到获取流程)]
 * @returns Result, or 'reselect' to restart acquisition [结果，或 'reselect' 表示重新获取]
 */
export async function pickManualDir(dialogs?: TempDirDialogs): Promise<TempDirResult | 'reselect'> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Empty Directory as Update Cache',
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled || filePaths.length === 0) {
    return { success: false, path: null, isManual: false };
  }
  const manualPath = filePaths[0];
  try {
    const items = await fs.readdir(manualPath);
    if (items.length > 0) {
      // Show non-empty directory confirmation (custom UI if callbacks provided) [显示目录非空确认 (有回调时用自定义 UI)]
      const confirmResponse = await askDirNotEmpty(dialogs);
      if (confirmResponse === 1) return 'reselect';
      await cleanDirectory(manualPath);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[TempManager] Manual dir check failed:', msg);
    return { success: false, path: null, isManual: false };
  }
  console.log('[TempManager] Using manually specified temp directory:', manualPath);
  return { success: true, path: manualPath, isManual: true };
}
