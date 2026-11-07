// Exit dialog: mutable state [退出弹窗 - 可变状态]

/** Double-Esc detection window in ms [双击 Esc 判定时间窗口 (毫秒)] */
export const DOUBLE_ESC_INTERVAL = 600;

/** Focused button index: 0 = return, 1 = quit [焦点按钮索引：0=返回, 1=退出] */
let focusedIndex = 0;

/** Dialog open state [弹窗打开状态] */
let isDialogOpen = false;

/** Timestamp of last Esc press [上次按 Esc 的时间戳] */
let lastEscTime = 0;

export function getFocusedIndex(): number { return focusedIndex; }
export function setFocusedIndex(v: number): void { focusedIndex = v; }

export function getIsDialogOpen(): boolean { return isDialogOpen; }
export function setIsDialogOpen(v: boolean): void { isDialogOpen = v; }

export function getLastEscTime(): number { return lastEscTime; }
export function setLastEscTime(v: number): void { lastEscTime = v; }
