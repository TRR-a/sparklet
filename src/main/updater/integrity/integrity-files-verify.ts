// Installed files integrity verification [已安装文件完整性校验]
// Combined-hash scan of the install root on startup [启动时对安装根目录做组合哈希扫描]
//
// Split out [已拆分]：gate checks → integrity-files-gate.ts,
// expected hash source → integrity-files-hash-source.ts,
// scan/compare → integrity-files-compare.ts.

import { getInstallRoot } from '../core/updater-paths.js';
import { shouldSkipInstalledFilesCheck } from './integrity-files-gate.js';
import { resolveExpectedFilesHash } from './integrity-files-hash-source.js';
import { compareInstalledFiles } from './integrity-files-compare.js';

/** Installed files verification result [已安装文件校验结果] */
export interface InstalledFilesResult {
  success: boolean;
  errors: string[];
}

/** Progress callback for verification [校验进度回调] */
type VerifyProgressCallback = (msg: string, percent: number) => void;

/**
 * Verify installed files integrity (called on startup) [校验已安装的文件完整性 (启动时调用)]
 * Enabled by default, scans all files under appRoot (excluding manifest file blacklist) [默认启用，扫描 appRoot 全目录下所有文件 (排除 manifest 文件黑名单)]
 * Uses filesHash first, falls back to hash (legacy format compatible) [优先用 filesHash，回退到 hash (兼容旧格式)]
 * Data source priority: cloud manifest.releases.json → local manifest.current.json → skip [数据源优先级：云端 manifest.releases.json → 本地 manifest.current.json → 跳过]
 */
export async function verifyInstalledFiles(currentVersion: string, onProgress: VerifyProgressCallback | null = null): Promise<InstalledFilesResult> {
  // Use install root (exe directory) as scan root, consistent with packaging side --files win-unpacked/ scope [用安装根目录 (exe 所在目录) 做扫描根，和打包端 --files win-unpacked/ 范围一致]
  const appRoot = getInstallRoot();

  if (await shouldSkipInstalledFilesCheck()) {
    return { success: true, errors: [] };
  }

  onProgress && onProgress('正在校验应用文件完整性...', 0);

  // Get expected filesHash (cloud first, local fallback) [获取预期的 filesHash (云端优先，本地兜底)]
  const expected = await resolveExpectedFilesHash(currentVersion);
  if (!expected.hash) {
    console.warn('[Verify] No filesHash source available, skipping installed files check');
    return { success: true, errors: [] };
  }

  onProgress && onProgress('正在计算文件哈希...', 30);

  const outcome = await compareInstalledFiles(appRoot, expected.hash, onProgress);
  if (!outcome.ok) {
    return { success: false, errors: outcome.errors };
  }
  return { success: true, errors: [] };
}
