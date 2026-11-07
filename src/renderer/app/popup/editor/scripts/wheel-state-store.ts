// Color wheel: HSV state [色环 - HSV 状态]

/** Current picker state [当前选择器状态] */
let hue = 0;
let sat = 0;
let val = 1;

/** Get current HSV [获取当前 HSV] */
export function getHsv(): { h: number; s: number; v: number } {
  return { h: hue, s: sat, v: val };
}

/** Set HSV state [设置 HSV 状态] */
export function setHsv(h: number, s: number, v: number): void {
  hue = h;
  sat = s;
  val = v;
}

/** Set brightness value [设置明度] */
export function setValue(v: number): void {
  val = v;
}

/** Read the raw components (internal use) [读取原始分量 (内部使用)] */
export function readHsv(): { h: number; s: number; v: number } {
  return { h: hue, s: sat, v: val };
}
