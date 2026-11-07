// Welcome clock: detail block (weekday / date / week / timezone) [欢迎页时钟 - 详细信息块]

import { getLang } from './welcome-i18n.js';
import { clockLocale, isoWeek, tzLabel } from './clock-format.js';

/** Update the detail block beneath the digital clock [更新电子钟下方的详细信息块] */
export function updateClockDetails(now: Date): void {
  // Details block: weekday, full date, week number, timezone [详细信息：星期、完整日期、周数、时区]
  const loc = clockLocale();
  const weekdayEl = document.getElementById('detailWeekday');
  if (weekdayEl) weekdayEl.textContent = new Intl.DateTimeFormat(loc, { weekday: 'long' }).format(now);
  const dateEl = document.getElementById('detailDate');
  if (dateEl) dateEl.textContent = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'long', day: 'numeric' }).format(now);
  const weekEl = document.getElementById('detailWeek');
  if (weekEl) weekEl.textContent = getLang() === 'zh-CN' ? `第 ${isoWeek(now)} 周` : `Week ${isoWeek(now)}`;
  const tzEl = document.getElementById('detailTz');
  if (tzEl) tzEl.textContent = tzLabel();
}
