// Integrity self-check: load manifest [完整性自检 - 读取清单]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getAppRoot } from 'sparklet/main/updater/startup/updater-paths.js';
import type { ManifestEntry } from 'sparklet/shared/types/updater/updater.js';

/**
 * Load manifest.current.json from exe dir, then appRoot [从 exe 目录读取 manifest.current.json，其次 appRoot]
 * @returns Parsed manifest or null [解析后的清单或 null]
 */
export async function loadCurrentManifestForSelfCheck(): Promise<ManifestEntry | null> {
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

  return currentManifest;
}
