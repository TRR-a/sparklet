// Updater error: network error classification [更新器错误 - 网络错误分类]

import type { NetworkErrorType } from 'sparklet/shared/types/updater/updater.js';

/**
 * Classify network/download errors in update flow (for friendly prompts to user) [统一分类更新流程中的网络/下载错误 (给上层做友好提示用)]
 * @param errorMsg Error message string (from Network error: xxx / Download timeout / status: 403 etc.) [错误消息字符串 (来自 Network error: xxx / Download timeout / status: 403 等)]
 * @returns Error type [错误类型]
 *   - offline      : No network / DNS failure / connection refused / timeout / proxy error (pure network layer) [断网 / DNS失败 / 连接拒绝 / 超时 / 代理错误 (纯网络层问题)]
 *   - rate-limit   : GitHub API rate limit (HTTP 403 + rate limit keyword) [GitHub API 限流 (HTTP 403 + rate limit 关键字)]
 *   - server-error : HTTP status 4xx/5xx (non-rate-limit) [HTTP 状态码 4xx/5xx (非限流)]
 *   - write-error  : Local disk write failure (Write error) [写本地磁盘失败 (Write error)]
 *   - unknown      : Other (JSON parse failure / invalid filename etc.) [其他 (JSON 解析失败 / 文件名不合法等业务错)]
 */
export function classifyNetworkError(errorMsg: string | null | undefined): NetworkErrorType {
  const msg = String(errorMsg || '').toLowerCase();
  if (!msg) return 'unknown';

  // Disk write error [写磁盘错误]
  if (msg.startsWith('write error:')) return 'write-error';

  // GitHub rate limit [GitHub 限流]
  if (msg.includes('rate limit') && msg.includes('exceeded')) return 'rate-limit';

  // HTTP non-2xx status code [HTTP 非 2xx 状态码]
  const statusMatch = msg.match(/status[:\s]+(\d{3})/);
  if (statusMatch) {
    const code = Number(statusMatch[1]);
    if (code === 403 && (msg.includes('ratelimit') || msg.includes('rate limit'))) return 'rate-limit';
    if (code >= 400 && code < 600) return 'server-error';
  }

  // Pure network layer errors [纯网络层错误]
  if (
    msg.startsWith('network error:') ||
    msg.includes('request timeout') ||
    msg.includes('download timeout') ||
    msg.includes('enotfound') ||       // DNS resolution failure [DNS 解析失败]
    msg.includes('eai_again') ||       // DNS retry failure [DNS 重试失败]
    msg.includes('econnrefused') ||    // Connection refused [连接被拒]
    msg.includes('econnreset') ||      // Connection reset [连接被重置]
    msg.includes('etimedout') ||       // Connection timeout [连接超时]
    msg.includes('esockettimedout') || // Socket timeout [Socket 超时]
    msg.includes('enetunreach') ||     // Network unreachable [网络不可达]
    msg.includes('ehostunreach') ||    // Host unreachable [主机不可达]
    msg.includes('eproto') ||          // Protocol error [协议错误]
    msg.includes('ssl routines') ||    // TLS/SSL handshake interrupted [TLS/SSL 握手中断]
    msg.includes('certificate') ||     // Certificate issue (user has proxy/sniffer etc.) [证书问题 (用户开了抓包代理等)]
    msg.includes('bad gateway') ||     // 502 (proxy issue, also counts as network instability) [502 (代理问题，也按网络不稳定算)]
    msg.includes('gateway timeout')    // 504
  ) return 'offline';

  return 'unknown';
}
