// Updater error classification & friendly formatting [更新器错误分类与友好格式化]
//
// Split out [已拆分]：classification → error-classify.ts,
// stage label → error-context-label.ts,
// network messages → error-network-messages.ts,
// business fallbacks → error-business-messages.ts.

import type { NetworkErrorType } from 'sparklet/shared/types/updater/updater.js';
import { classifyNetworkError } from '../error/error-classify.js';
import { contextLabel } from '../error/error-context-label.js';
import type { ErrorContext } from '../error/error-context-label.js';
import { networkErrorMessage } from '../error/error-network-messages.js';
import { businessErrorMessage } from '../error/error-business-messages.js';

export { classifyNetworkError } from '../error/error-classify.js';
export { contextLabel } from '../error/error-context-label.js';
export type { ErrorContext } from '../error/error-context-label.js';

/**
 * Convert raw English error from update flow to user-friendly Chinese prompt [把更新流程里的原始英文错误转换成用户能看懂的中文提示]
 * @param errorMsg Original error message [原始错误消息]
 * @param errorType Classification from classifyNetworkError (if omitted, inferred from errorMsg) [classifyNetworkError 返回的分类 (缺省会尝试从 errorMsg 推断)]
 * @param context Which stage the error occurred in, for more precise prompt [发生在哪个阶段，提示更精准]
 */
export function formatFriendlyUpdateError(
  errorMsg: string | null,
  errorType: NetworkErrorType | null,
  context: ErrorContext = 'check'
): string {
  const type: NetworkErrorType = (errorType && errorType !== 'unknown')
    ? errorType
    : classifyNetworkError(errorMsg);

  const ctxLabel = contextLabel(context);

  const networkMsg = networkErrorMessage(type, ctxLabel);
  if (networkMsg) return networkMsg;

  return businessErrorMessage(errorMsg, ctxLabel);
}
