// GitHub release fetch: result type [GitHub Release 获取 - 结果类型]

import type { NetworkErrorType } from 'sparklet/shared/types/updater/updater.js';
import type { ReleaseData } from '../manifest/manifest-helper.js';

/** Latest release fetch result [最新 Release 获取结果] */
export interface FetchReleaseResult {
  success: boolean;
  data: ReleaseData | null;
  error: string | null;
  errorType: NetworkErrorType | null;
}

/** Build a failed fetch result [构造失败的获取结果] */
export function failFetchResult(error: string): FetchReleaseResult {
  return {
    success: false,
    data: null,
    error,
    errorType: null
  };
}

/** Build a successful fetch result [构造成功的获取结果] */
export function okFetchResult(data: ReleaseData): FetchReleaseResult {
  return { success: true, data, error: null, errorType: null };
}
