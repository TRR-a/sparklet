// Installed files verify: scan and compare [已安装文件校验 - 扫描与比对]

import * as fs from 'fs-extra';
import { collectAllFiles, computeCombinedHash } from 'sparklet/main/updater/integrity/integrity-file-utils.js';

/** Outcome of the scan-and-compare step [扫描比对结果] */
export interface FilesCompareOutcome {
  ok: boolean;
  errors: string[];
  fileCount: number;
}

/**
 * Collect all files under appRoot and compare the combined hash with the expected one
 * [收集 appRoot 下全部文件，并把组合哈希与期望值比对]
 * @param onProgress Progress callback for file scan/verify stages [扫描/校验阶段的进度回调]
 */
export async function compareInstalledFiles(
  appRoot: string,
  expectedFilesHash: string,
  onProgress: ((msg: string, percent: number) => void) | null = null
): Promise<FilesCompareOutcome> {
  const errors: string[] = [];
  try {
    const exists = await fs.pathExists(appRoot);
    if (!exists) {
      errors.push(`应用根目录不存在: ${appRoot}`);
      return { ok: false, errors, fileCount: 0 };
    }

    const files: string[] = [];
    await collectAllFiles(appRoot, files);

    if (files.length === 0) {
      errors.push('未找到任何应用文件');
      return { ok: false, errors, fileCount: 0 };
    }

    onProgress && onProgress(`正在校验 ${files.length} 个文件...`, 60);

    const combinedHash = await computeCombinedHash(files);

    if (combinedHash !== expectedFilesHash) {
      errors.push(`文件完整性校验失败: 期望 ${expectedFilesHash.slice(0, 16)}...，实际 ${combinedHash.slice(0, 16)}...`);
      return { ok: false, errors, fileCount: files.length };
    }

    onProgress && onProgress('✅ 文件完整性校验通过', 100);
    console.log('[Verify] Installed files integrity check passed (,', files.length, 'files)');
    return { ok: true, errors: [], fileCount: files.length };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Verify] Integrity check error:', msg);
    errors.push(`校验过程出错: ${msg}`);
    return { ok: false, errors, fileCount: 0 };
  }
}
