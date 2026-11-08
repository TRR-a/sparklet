// Hash & version utilities [哈希与版本工具]

import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import type { ManifestEntry } from 'sparklet/shared/types/updater/updater.js';

/**
 * Normalize version string: strip 'v' prefix before comparison [规范化版本号：统一去掉 v 前缀后再比较]
 */
export function normalizeVersion(v: string | null | undefined): string {
  if (!v) return '';
  return String(v).replace(/^v/i, '').trim();
}

/**
 * Compute SHA256 hash of a file [计算文件的 SHA256 哈希]
 */
export async function computeSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk: Buffer | string) => hash.update(chunk as Buffer));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Extract a specific hash field from manifest entry. [从 entry 中提取指定 hash 字段。]
 * Semantic isolation principle: different hash fields have different semantics, cross-field fallback is forbidden to avoid false positives. [语义隔离原则：不同 hash 字段语义不同，禁止跨字段兜底导致 100% 误报。]
 *
 * Three verification scenarios: [三校验场景：]
 *   - packageHash: ZIP package integrity (verified after download) ← can fallback to legacy hash field (old versions stored ZIP hash there) [packageHash：ZIP 安装包完整性 (下载后校验) ← 可以 fallback 到旧 hash 字段 (老版本 hash 存的就是 ZIP hash)]
 *   - exeHash: Sparklet.exe integrity (startup self-check) ← no fallback, skip if missing [exeHash：Sparklet.exe 完整性 (启动时自检) ← 禁止 fallback，没有就跳过校验]
 *   - filesHash: All extracted files integrity (startup self-check) ← no fallback, skip if missing [filesHash：解压后全部文件完整性 (启动时自检) ← 禁止 fallback，没有就跳过校验]
 */
export function getHashField(entry: ManifestEntry | null | undefined, fieldName: 'packageHash' | 'exeHash' | 'filesHash'): string | null {
  if (!entry) return null;
  const value = entry[fieldName];
  if (value) return value;
  // Only packageHash ↔ legacy entry.hash can fallback to each other (same semantics, both ZIP-level / old single hash) [只有 packageHash ↔ 旧 entry.hash 可以互相兜底 (语义一致，都是 ZIP 级别 / 老版本单一 hash)]
  if (fieldName === 'packageHash') return entry.hash || null;
  // filesHash and exeHash must NOT fallback to entry.hash (99% of the time entry.hash stores packageHash/ZIP hash) [filesHash 和 exeHash 不允许 fallback 到 entry.hash (99% 情况下 entry.hash 存的是 packageHash/ZIP 的 hash)]
  // Otherwise comparing ZIP hash with "all extracted files combined hash" or "single exe hash" would never match → false positive every startup [否则会把 ZIP 的 hash 拿去和「解压后全部文件组合 hash」或「单 exe hash」比较，必然不相等 → 每次启动误报]
  return null;
}
