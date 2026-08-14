// Temp directory management: acquire, clean, release [临时目录管理：获取、清理、释放]

import * as fs from 'fs-extra';
import * as path from 'path';
import { app, dialog } from 'electron';
import { TEMP_DIR_NAMES, getTempPath } from './constants';
import type { TempDirResult } from '../../shared/types/updater';

/**
 * Clean all items in a directory (keep the directory itself) [清理目录内所有条目 (保留目录本身)]
 * @param dirPath Directory path to clean [待清理的目录路径]
 * @returns Whether cleaning succeeded [是否清理成功]
 */
export async function cleanDirectory(dirPath: string): Promise<boolean> {
  try {
    const exists = await fs.pathExists(dirPath);
    if (!exists) return true;
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      await fs.remove(itemPath);
    }
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[TempManager] Clean directory failed:', dirPath, msg);
    return false;
  }
}

/**
 * Acquire an available temp directory [获取可用的临时目录]
 * Tries each candidate directory in order; if all fail, prompts user to retry or specify manually [按顺序尝试每个候选目录；若全部失败，提示用户重试或手动指定]
 * @returns Temp directory acquire result [临时目录获取结果]
 */
export async function acquireTempDir(): Promise<TempDirResult> {
  const tempBase = getTempPath();
  for (const dirName of TEMP_DIR_NAMES) {
    const fullPath = path.join(tempBase, dirName);
    try {
      const exists = await fs.pathExists(fullPath);
      if (!exists) {
        await fs.ensureDir(fullPath);
        console.log('[TempManager] Created temp directory:', fullPath);
        return { success: true, path: fullPath, isManual: false };
      } else {
        const cleaned = await cleanDirectory(fullPath);
        if (cleaned) {
          console.log('[TempManager] Reused and cleaned temp directory:', fullPath);
          return { success: true, path: fullPath, isManual: false };
        }
        console.warn('[TempManager] Clean failed, trying next:', fullPath);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[TempManager] Access error:', fullPath, msg);
    }
  }

  console.error('[TempManager] All candidate directories unavailable');
  const result = await dialog.showMessageBox({
    type: 'warning',
    title: 'Update Temp Directory Error',
    message: 'Unable to create or clean temp directory. Please manually clean Sparklet-* or sparklet-* folders in %TEMP%, or specify an empty directory as update cache.',
    buttons: ['Retry', 'Specify Manually', 'Cancel'],
    defaultId: 0,
    cancelId: 2
  });

  if (result.response === 0) {
    return acquireTempDir();
  } else if (result.response === 1) {
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
        const confirm = await dialog.showMessageBox({
          type: 'warning',
          title: 'Directory Not Empty',
          message: 'Selected directory is not empty. Continue? (It will be cleaned after update)',
          buttons: ['Continue', 'Reselect'],
          defaultId: 0,
          cancelId: 1
        });
        if (confirm.response === 1) return acquireTempDir();
        await cleanDirectory(manualPath);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[TempManager] Manual dir check failed:', msg);
      return { success: false, path: null, isManual: false };
    }
    console.log('[TempManager] Using manually specified temp directory:', manualPath);
    return { success: true, path: manualPath, isManual: true };
  } else {
    return { success: false, path: null, isManual: false };
  }
}

/**
 * Release a temp directory (clean or remove based on acquisition mode) [释放临时目录 (根据获取方式清理或删除)]
 * @param dirPath Directory path to release [待释放的目录路径]
 * @param isManual Whether the directory was manually specified [是否为手动指定的目录]
 */
export async function releaseTempDir(dirPath: string | null, isManual: boolean = false): Promise<void> {
  if (!dirPath) return;
  try {
    if (isManual) {
      await fs.remove(dirPath);
      console.log('[TempManager] Removed manual temp directory:', dirPath);
    } else {
      await cleanDirectory(dirPath);
      console.log('[TempManager] Cleaned temp directory:', dirPath);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[TempManager] Release failed:', dirPath, msg);
  }
}
