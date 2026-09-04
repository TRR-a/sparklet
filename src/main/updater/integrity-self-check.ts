// Startup integrity self-check of the running executable [运行中可执行文件的启动完整性自检]

import * as fs from 'fs-extra';
import * as path from 'path';
import { app } from 'electron';
import { getAppRoot } from './constants';
import { computeSha256, getHashField } from './verify';
import type { ManifestEntry } from '../../shared/types/updater';

/** Integrity self-check result [完整性自检结果] */
interface IntegrityResult {
  success: boolean;
  error: string | null;
}

/**
 * Startup integrity self-check: verify the running exe has not been tampered with [启动时完整性自检：校验当前运行的 exe 文件是否被篡改]
 * Uses external manifest.current.json (same directory as exe) [使用外挂的 manifest.current.json (与 exe 同目录)]
 * Uses exeHash first, falls back to hash [优先用 exeHash，回退到 hash]
 */
export async function selfCheckIntegrity(): Promise<IntegrityResult> {
  console.log('[Verify] Running startup integrity self-check');

  if (!app.isPackaged) {
    console.log('[Verify] Development environment, skipping self-check');
    return { success: true, error: null };
  }

  const exeDir = path.dirname(process.execPath);
  const appRoot = getAppRoot();
  // Prefer reading from exe directory (user install dir), then from appRoot (where installer writes) [优先读 exe 目录 (用户安装目录)，其次读 appRoot (installer 写入的位置)]
  const candidatePaths = [
    path.join(exeDir, 'manifest.current.json'),
    path.join(appRoot, 'manifest.current.json')
  ];

  let currentManifest: ManifestEntry | null = null;
  for (const manifestPath of candidatePaths) {
    try {
      const exists = await fs.pathExists(manifestPath);
      if (!exists) continue;
      const content = await fs.readFile(manifestPath, 'utf-8');
      currentManifest = JSON.parse(content) as ManifestEntry;
      console.log('[Verify] Loaded manifest.current.json from:', manifestPath);
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Verify] Failed to read manifest.current.json at', manifestPath, ':', msg);
    }
  }

  if (!currentManifest) {
    console.warn('[Verify] manifest.current.json not found, skipping self-check');
    return { success: true, error: null };
  }

  const expectedExeHash = getHashField(currentManifest, 'exeHash');
  if (!expectedExeHash) {
    console.warn('[Verify] manifest.current.json missing exeHash/hash field, skipping self-check');
    return { success: true, error: null };
  }

  try {
    const currentExePath = process.execPath;
    const exists = await fs.pathExists(currentExePath);
    if (!exists) {
      console.warn('[Verify] Current exe file not found, skipping self-check');
      return { success: true, error: null };
    }

    const actualHash = await computeSha256(currentExePath);
    if (actualHash !== expectedExeHash) {
      return {
        success: false,
        error: `Integrity check failed: executable file hash mismatch`
      };
    }

    console.log('[Verify] Integrity self-check passed');
    return { success: true, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Verify] Self-check error:', msg);
    return { success: true, error: null };
  }
}
