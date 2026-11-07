// Manifest: request options + response parsing [清单 - 请求参数与响应解析]

import { URL } from 'url';
import * as https from 'https';
import type { ManifestEntry } from 'sparklet/shared/types/updater';

/** Build the request options for a manifest asset URL [为清单附件地址构造请求参数] */
export function buildManifestRequestOptions(downloadUrl: string): https.RequestOptions {
  const urlObj = new URL(downloadUrl);
  return {
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    method: 'GET',
    headers: { 'User-Agent': 'Sparklet-Updater', 'Accept': 'application/json' },
    timeout: 10000
  };
}

/** Parse a manifest body into entries, or null when it is not a non-empty array [解析清单正文为条目数组，非空数组以外一律 null] */
export function parseManifestBody(data: string): ManifestEntry[] | null {
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('[ManifestHelper] Invalid manifest format, expecting non-empty array');
      return null;
    }
    // Return full array directly, no field validation [直接返回完整数组，不做字段校验]
    return parsed as ManifestEntry[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ManifestHelper] Parse manifest failed:', msg);
    return null;
  }
}
