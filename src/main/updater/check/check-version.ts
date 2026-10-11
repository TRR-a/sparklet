// Version retrieval and comparison [版本获取与比较]

import { app } from 'electron';

// Get current app version from Electron (value comes from package.json, which is
// kept in sync with version.json by scripts/sync-version.cjs)
// [获取当前应用版本号：经 Electron 读取 (值来自 package.json，由 sync-version.cjs
// 与 version.json 保持同步)]
export function getCurrentVersion(): string {
  return app.getVersion() || '0.0.0';
}

/**
 * Compare two version strings (e.g. "0.2.2" vs "0.2.3") [比较两个版本字符串 (如 "0.2.2" vs "0.2.3")]
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal [v1 > v2 返回 1，v1 < v2 返回 -1，相等返回 0]
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i];
    const p2 = parts2[i];
    if (isNaN(p1) || isNaN(p2)) {
      const s1 = String(parts1[i] ?? '');
      const s2 = String(parts2[i] ?? '');
      if (s1 > s2) return 1;
      if (s1 < s2) return -1;
      continue;
    }
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}
