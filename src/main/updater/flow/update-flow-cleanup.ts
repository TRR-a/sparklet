// Update flow: cleanup helper [更新流程 - 清理辅助]

import * as fs from 'fs-extra';
import { releaseTempDir } from '../temp/temp-manager.js';

/** Remove the downloaded zip (best effort) and release the temp dir [删除下载包 (尽力而为) 并释放临时目录] */
export async function cleanupUpdateArtifacts(
  zipPath: string | null,
  tempDir: string | null,
  isManualDir: boolean
): Promise<void> {
  if (zipPath) await fs.remove(zipPath).catch(() => {});
  if (tempDir) await releaseTempDir(tempDir, isManualDir);
}
