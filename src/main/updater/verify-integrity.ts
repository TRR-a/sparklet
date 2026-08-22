// Runtime integrity verification [运行时完整性校验]
// Startup self-check (exe hash) and installed files verification (combined hash) [启动自检 (exe 哈希) 和已安装文件校验 (组合哈希)]

import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import { app } from 'electron';
import { fetchReleasesManifest, readCurrentManifest } from './manifest-helper';
import { isExcludedFromIntegrity, getAppRoot, getInstallRoot } from './constants';
import { getConfigItem } from './config-manager';
import { computeSha256, getHashField, normalizeVersion } from './verify';
import type { ManifestEntry } from '../../shared/types/updater';

/** Integrity self-check result [完整性自检结果] */
interface IntegrityResult {
  success: boolean;
  error: string | null;
}

/** Installed files verification result [已安装文件校验结果] */
export interface InstalledFilesResult {
  success: boolean;
  errors: string[];
}

/** Progress callback for verification [校验进度回调] */
type VerifyProgressCallback = (msg: string, percent: number) => void;

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

/**
 * Recursively collect all files in a directory (excluding exact filename blacklist + extension blacklist) [递归收集目录下所有文件 (排除精确文件名黑名单 + 扩展名黑名单)]
 * Both generation side and runtime use isExcludedFromIntegrity for filtering, ensuring consistent rules [生成端和运行端统一用 isExcludedFromIntegrity 过滤，保证规则一致]
 */
export async function collectAllFiles(dir: string, fileList: string[]): Promise<void> {
  const items = await fs.readdir(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await collectAllFiles(fullPath, fileList);
    } else {
      // Dual filter by exact filename + extension (.log/.dmp/.tmp etc. excluded from hash) [精确文件名 + 扩展名双重过滤 (.log/.dmp/.tmp 等临时/崩溃文件一律不参与 hash)]
      if (isExcludedFromIntegrity(item)) {
        continue;
      }
      fileList.push(fullPath);
    }
  }
}

/**
 * Compute combined hash of multiple files (sort by path, concatenate content, then SHA256) [计算多个文件的组合哈希 (按路径排序后拼接内容，再算 SHA256)]
 */
export async function computeCombinedHash(filePaths: string[]): Promise<string> {
  const hash = crypto.createHash('sha256');
  const sorted = filePaths.slice().sort();
  for (const filePath of sorted) {
    const content = await fs.readFile(filePath);
    hash.update(content);
  }
  return hash.digest('hex');
}
