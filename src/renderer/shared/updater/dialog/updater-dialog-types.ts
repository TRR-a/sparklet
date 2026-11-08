// Updater dialog content types [更新器弹窗内容类型]

/** Dialog button definition [弹窗按钮定义] */
export interface DialogButton {
  index: number;
  label: string;
  style: 'ok' | 'cancel' | 'default';
  onClick?: () => void;
}

/** Dialog content result [弹窗内容结果] */
export interface DialogContent {
  title: string;
  bodyHtml: string;
  buttons: DialogButton[];
}

/** Updater dialog params from main process [来自主进程的更新器弹窗参数] */
export interface UpdaterDialogParams {
  dialogId: string;
  dialogType: string;
  params: Record<string, unknown>;
  timeoutMs: number;
}
