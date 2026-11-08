// Manifest: read bundled manifest.current.json [清单 - 读取随应用打包的清单]

import * as fs from 'fs-extra';
import * as path from 'path';
import { getAppRoot } from '../startup/updater-paths.js';
import type { ManifestEntry } from 'sparklet/shared/types/updater/updater.js';

/**
 * Read the bundled manifest.current.json [读取随应用打包的 manifest.current.json]
 * @returns Full object, or null if file missing/parse failed [完整对象，或 null (文件不存在/解析失败)]
 */
export async function readCurrentManifest(): Promise<ManifestEntry | null> {
  const manifestPath = path.join(getAppRoot(), 'manifest.current.json');
  try {
    const exists = await fs.pathExists(manifestPath);
    if (!exists) {
      console.warn('[ManifestHelper] manifest.current.json not found');
      return null;
    }
    const content = await fs.readFile(manifestPath, 'utf-8');
    const data = JSON.parse(content) as ManifestEntry;
    // Return full object directly, no field validation [直接返回完整对象，不做字段校验]
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ManifestHelper] Read manifest.current.json failed:', msg);
    return null;
  }
}
