// Welcome clock: formatting helpers [欢迎页时钟 - 格式化辅助]

import { getLang } from './welcome-i18n.js';

/** Locale used by the clock cards [时钟卡片使用的语言环境] */
export function clockLocale(): string {
  return getLang() === 'zh-CN' ? 'zh-CN' : 'en-US';
}

/** Zero-pad a number to two digits [数字补零到两位] */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO week number of a date [日期的 ISO 周数] */
export function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Timezone label like GMT+8 / GMT+5:30 [形如 GMT+8 / GMT+5:30 的时区标签] */
export function tzLabel(): string {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const h = Math.floor(Math.abs(offset) / 60);
  const m = Math.abs(offset) % 60;
  return `GMT${sign}${h}${m ? `:${pad2(m)}` : ''}`;
}
