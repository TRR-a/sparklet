// Custom confirm dialog: options type [自定义确认弹窗 - 选项类型]

/** Custom confirm dialog options [自定义确认弹窗选项] */
export interface ConfirmOptions {
  title?: string;
  message?: string;
  okText?: string;
  cancelText?: string;
  okDanger?: boolean;
}

/** Resolved DOM handles of the confirm modal [确认弹窗的 DOM 句柄] */
export interface ConfirmElements {
  modal: HTMLElement;
  titleEl: HTMLElement;
  msgEl: HTMLElement;
  okBtn: HTMLButtonElement;
  cancelBtn: HTMLButtonElement;
}
