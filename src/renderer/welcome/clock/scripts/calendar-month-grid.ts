// Welcome clock: month grid cells [欢迎页时钟 - 月历网格单元格]
//
// Split out [已拆分]：cell builders → calendar-month-cell.ts.

import { buildMonthCell, buildBlankCell } from 'sparklet/renderer/welcome/clock/scripts/calendar-month-cell.js';

/**
 * Render the month grid; leading/trailing cells show adjacent-month days dimmed
 * [渲染月历，首尾空格以暗色显示相邻月份日期]
 * @param selectedDay Selected day-of-month (null = today highlighted) [选中的日期 (null = 高亮今天)]
 * @param onSelectDay Invoked with the clicked day [点击某日时的回调]
 */
export function renderMonthGrid(
  grid: HTMLElement,
  now: Date,
  selectedDay: number | null,
  onSelectDay: (day: number) => void
): void {
  const year = now.getFullYear();
  const month = now.getMonth();
  const startBlank = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  grid.innerHTML = '';
  for (let i = 0; i < startBlank; i++) {
    grid.appendChild(buildBlankCell(String(prevMonthDays - startBlank + 1 + i)));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    grid.appendChild(buildMonthCell(d, now, selectedDay, onSelectDay));
  }
  const filled = startBlank + daysInMonth;
  const trailing = (7 - (filled % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    grid.appendChild(buildBlankCell(String(i)));
  }
}
