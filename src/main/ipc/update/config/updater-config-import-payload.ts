// Updater config import: extract config payload [更新配置导入 - 取出配置负载]

/**
 * Extract the config object from the parsed file payload [从解析后的文件负载里取出配置对象]
 * Accepts both `{ config: {...} }` and a bare config object [同时接受 { config } 与裸配置对象]
 */
export function extractConfigPayload(payload: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const raw = payload && payload.config && typeof payload.config === 'object'
    ? payload.config as Record<string, unknown>
    : (payload || {});
  return raw;
}
