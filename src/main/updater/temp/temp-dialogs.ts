// Temp dir: error/confirm dialogs [临时目录 - 错误/确认弹窗]

import { dialog } from 'electron';

/**
 * Dialog callbacks for temp directory errors (provided by caller to use renderer custom UI) [临时目录错误的弹窗回调 (由调用方提供以使用渲染层自定义 UI)]
 * - showTempDirError: returns 0=Retry, 1=Specify Manually, 2=Cancel
 * - showDirNotEmptyConfirm: returns 0=Continue, 1=Reselect
 */
export interface TempDirDialogs {
  showTempDirError: () => Promise<number>;
  showDirNotEmptyConfirm: () => Promise<number>;
}

/**
 * Ask how to proceed after all candidate temp dirs failed [全部候选目录失败后询问下一步]
 */
export async function askTempDirError(dialogs?: TempDirDialogs): Promise<number> {
  if (dialogs?.showTempDirError) {
    return dialogs.showTempDirError();
  }
  const result = await dialog.showMessageBox({
    type: 'warning',
    title: 'Update Temp Directory Error',
    message: 'Unable to create or clean temp directory. Please manually clean Sparklet-* or sparklet-* folders in %TEMP%, or specify an empty directory as update cache.',
    buttons: ['Retry', 'Specify Manually', 'Cancel'],
    defaultId: 0,
    cancelId: 2
  });
  return result.response;
}

/**
 * Ask for confirmation when a manually selected directory is not empty [手动目录非空时确认]
 */
export async function askDirNotEmpty(dialogs?: TempDirDialogs): Promise<number> {
  if (dialogs?.showDirNotEmptyConfirm) {
    return dialogs.showDirNotEmptyConfirm();
  }
  const confirm = await dialog.showMessageBox({
    type: 'warning',
    title: 'Directory Not Empty',
    message: 'Selected directory is not empty. Continue? (It will be cleaned after update)',
    buttons: ['Continue', 'Reselect'],
    defaultId: 0,
    cancelId: 1
  });
  return confirm.response;
}
