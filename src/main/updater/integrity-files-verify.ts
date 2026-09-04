// Installed files integrity verification [已安装文件完整性校验]
// Combined-hash scan of the install root on startup [启动时对安装根目录做组合哈希扫描]

import * as fs from 'fs-extra';
import { app } from 'electron';
import { fetchReleasesManifest, readCurrentManifest } from './manifest-helper';
import { getInstallRoot } from './constants';
import { getConfigItem } from './config-manager';
import { getHashField, normalizeVersion } from './verify';
import { collectAllFiles, computeCombinedHash } from './integrity-file-utils';

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
  const errors: string[] = [];
  // Use install root (exe directory) as scan root, consistent with packaging side --files win-unpacked/ scope [用安装根目录 (exe 所在目录) 做扫描根，和打包端 --files win-unpacked/ 范围一致]
  const appRoot = getInstallRoot();

  // Skip check in development environment [开发环境跳过校验]
  if (!app.isPackaged) {
    console.log('[Verify] Development environment, skipping installed files check');
    return { success: true, errors: [] };
  }

  // Read config, check if integrity check is enabled [读取配置，检查是否启用完整性校验]
  try {
    const enabled = await getConfigItem('integrityCheck');
    if (enabled === false) {
      console.log('[Verify] Integrity check disabled by user');
      return { success: true, errors: [] };
    }
  } catch (err) {
    console.log('[Verify] Config read failed, using default (enabled)');
  }

  onProgress && onProgress('正在校验应用文件完整性...', 0);

  // Get expected filesHash (cloud first, local fallback) [获取预期的 filesHash (云端优先，本地兜底)]
  let expectedFilesHash: string | null = null;
  let hashSource: string | null = null;

  try {
    const manifestUrl = `https://github.com/TRR-a/sparklet/releases/download/v${currentVersion}/manifest.releases.json`;
    const releases = await fetchReleasesManifest(manifestUrl);
    if (releases && Array.isArray(releases)) {
      const targetEntry = releases.find(item =>
        normalizeVersion(item.version) === normalizeVersion(currentVersion)
      );
      const fHash = getHashField(targetEntry, 'filesHash');
      if (fHash) {
        expectedFilesHash = fHash;
        hashSource = 'cloud';
        console.log('[Verify] Using cloud manifest for files integrity check');
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('[Verify] Cloud manifest fetch failed:', msg);
  }

  if (!expectedFilesHash) {
    try {
      const localManifest = await readCurrentManifest();
      const fHash = getHashField(localManifest, 'filesHash');
      if (fHash) {
        expectedFilesHash = fHash;
        hashSource = 'local';
        console.log('[Verify] Using local manifest for files integrity check');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log('[Verify] Local manifest read failed:', msg);
    }
  }

  if (!expectedFilesHash) {
    console.warn('[Verify] No filesHash source available, skipping installed files check');
    return { success: true, errors: [] };
  }

  onProgress && onProgress('正在计算文件哈希...', 30);

  try {
    const exists = await fs.pathExists(appRoot);
    if (!exists) {
      errors.push(`应用根目录不存在: ${appRoot}`);
      return { success: false, errors };
    }

    const files: string[] = [];
    await collectAllFiles(appRoot, files);

    if (files.length === 0) {
      errors.push('未找到任何应用文件');
      return { success: false, errors };
    }

    onProgress && onProgress(`正在校验 ${files.length} 个文件...`, 60);

    const combinedHash = await computeCombinedHash(files);

    if (combinedHash !== expectedFilesHash) {
      errors.push(`文件完整性校验失败: 期望 ${expectedFilesHash.slice(0, 16)}...，实际 ${combinedHash.slice(0, 16)}...`);
      return { success: false, errors };
    }

    onProgress && onProgress('✅ 文件完整性校验通过', 100);
    console.log('[Verify] Installed files integrity check passed (source:', hashSource, ',', files.length, 'files)');
    return { success: true, errors: [] };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Verify] Integrity check error:', msg);
    errors.push(`校验过程出错: ${msg}`);
    return { success: false, errors };
  }
}
