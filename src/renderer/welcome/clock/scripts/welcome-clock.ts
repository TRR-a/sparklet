// Welcome clock cards: calendar / analog / digital [欢迎页时间卡片 - 日历/钟面/电子钟]
//
// Split out [已拆分]：format helpers → clock-format.ts,
// analog face → clock-analog.ts, calendar → clock-calendar.ts,
// digital readout → clock-digital.ts, detail block → clock-details.ts.

import { updateAnalogHands } from './clock-analog.js';
import { renderCalendar, calendarDayKey } from './clock-calendar.js';
import { updateDigitalClock } from './clock-digital.js';
import { updateClockDetails } from './clock-details.js';

let lastCalKey = '';

export { setUse12Hour } from './clock-digital.js';
export { buildAnalogTicksExport } from './clock-analog.js';

/** Per-second refresh of hands, digital clock and details; calendar redraws on day change [每秒刷新指针、方时钟与详细信息；跨天时重绘日历] */
export function tickClocks(): void {
  const now = new Date();

  updateAnalogHands(now);
  updateDigitalClock(now);
  updateClockDetails(now);

  const key = calendarDayKey(now);
  if (key !== lastCalKey) {
    renderCalendar(now);
    lastCalKey = key;
  }
}
