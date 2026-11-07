// Dialog shared types [弹窗共享类型]

import type { DialogResponse } from 'sparklet/shared/types/updater';

/** Progress callback type [进度回调类型] */
export type ProgressCallback = (msg: string, percent: number) => void;

/** Complete callback type [完成回调类型] */
export type CompleteCallback = (success: boolean, error: string | null, friendlyError?: string) => void;

/** Dialog params type [弹窗参数类型] */
export type DialogParams = Record<string, unknown>;

/** Dialog options [弹窗选项] */
export interface DialogOptions {
  timeoutMs?: number;
  fallbackResponse?: DialogResponse;
  fallbackToSystemDialog?: boolean;
}
