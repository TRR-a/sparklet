// Temp directory management: acquire, clean, release [临时目录管理：获取、清理、释放]

import * as fs from 'fs-extra';
import * as path from 'path';
import { app, dialog } from 'electron';
import { TEMP_DIR_NAMES, getTempPath } from './constants';
import type { TempDirResult } from '../../shared/types/updater';

/**
 * Dialog callbacks for temp directory errors (provided by caller to use renderer custom UI) [临时目录错误的弹窗回调 (由调用方提供以使用渲染层自定义 UI)]
 * - showTempDirError: returns 0=Retry, 1=Specify Manually, 2=Cancel
 * - showDirNotEmptyConfirm: returns 0=Continue, 1=Reselect
 */
export interface TempDirDialogs {
  showTempDirError: () => Promise<number>;
  showDirNotEmptyConfirm: () => Promise<number>;
}

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
 * @param dialogs Optional dialog callbacks (uses renderer custom UI when provided, falls back to system dialog otherwise) [可选弹窗回调 (提供时使用渲染层自定义 UI，否则回退到系统弹窗)]
 * @returns Temp directory acquire result [临时目录获取结果]
 */
export async function acquireTempDir(dialogs?: TempDirDialogs): Promise<TempDirResult> {
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

  // Show error dialog (custom UI if callbacks provided, otherwise system dialog) [显示错误弹窗 (有回调时用自定义 UI，否则用系统弹窗)]
  let errorResponse: number;
  if (dialogs?.showTempDirError) {
    errorResponse = await dialogs.showTempDirError();
  } else {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Update Temp Directory Error',
      message: 'Unable to create or clean temp directory. Please manually clean Sparklet-* or sparklet-* folders in %TEMP%, or specify an empty directory as update cache.',
      buttons: ['Retry', 'Specify Manually', 'Cancel'],
      defaultId: 0,
      cancelId: 2
    });
    errorResponse = result.response;
  }

  if (errorResponse === 0) {
    return acquireTempDir(dialogs);
  } else if (errorResponse === 1) {
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
        let confirmResponse: number;
        if (dialogs?.showDirNotEmptyConfirm) {
          confirmResponse = await dialogs.showDirNotEmptyConfirm();
        } else {
          const confirm = await dialog.showMessageBox({
            type: 'warning',
            title: 'Directory Not Empty',
            message: 'Selected directory is not empty. Continue? (It will be cleaned after update)',
            buttons: ['Continue', 'Reselect'],
            defaultId: 0,
            cancelId: 1
          });
          confirmResponse = confirm.response;
        }
        if (confirmResponse === 1) return acquireTempDir(dialogs);
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
