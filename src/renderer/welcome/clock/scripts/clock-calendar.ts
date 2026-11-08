// Welcome clock: calendar month grid [欢迎页时钟 - 月历网格]
// Weekday header in calendar-weekdays.ts, month cells in calendar-month-grid.ts
// [星期表头在 calendar-weekdays.ts，月历单元格在 calendar-month-grid.ts]

import { clockLocale } from 'sparklet/renderer/welcome/clock/scripts/clock-format.js';
import { renderWeekdayHeader } from 'sparklet/renderer/welcome/clock/scripts/calendar-weekdays.js';
import { renderMonthGrid } from 'sparklet/renderer/welcome/clock/scripts/calendar-month-grid.js';

/** Selected day-of-month in the displayed month (null = today highlighted) [日历中选中的日期 (null = 高亮今天)] */
let selectedDay: number | null = null;

/** Render the month grid; leading/trailing cells show adjacent-month days dimmed [渲染月历，首尾空格以暗色显示相邻月份日期] */
export function renderCalendar(now: Date): void {
  const title = document.getElementById('calTitle');
  const weekdays = document.getElementById('calWeekdays');
  const grid = document.getElementById('calGrid');
  if (!title || !weekdays || !grid) return;
  const loc = clockLocale();
  title.textContent = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'long' }).format(now);

  renderWeekdayHeader(weekdays, loc);

  renderMonthGrid(grid, now, selectedDay, (d) => {
    // Clicking today again clears the selection back to default [再点今天则清除选中回到默认]
    selectedDay = d === now.getDate() ? null : d;
    renderCalendar(now);
  });
}

/** Day identity key used to decide whether the calendar needs a redraw [用于判断日历是否需要重绘的日期键] */
export function calendarDayKey(now: Date): string {
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}
