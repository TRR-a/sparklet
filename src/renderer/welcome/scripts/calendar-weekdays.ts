// Welcome clock: weekday header [欢迎页时钟 - 星期表头]

/**
 * Render the Sun..Sat weekday header [渲染周日..周六表头]
 */
export function renderWeekdayHeader(weekdays: HTMLElement, loc: string): void {
  weekdays.innerHTML = '';
  for (let d = 0; d < 7; d++) {
    // 2023-01-01 is a Sunday, giving a stable Sun..Sat header [2023-01-01 为周日，得到稳定的周日..周六表头]
    const base = new Date(2023, 0, 1 + d);
    const cell = document.createElement('span');
    cell.className = 'calendar-weekday';
    cell.textContent = new Intl.DateTimeFormat(loc, { weekday: 'narrow' }).format(base);
    weekdays.appendChild(cell);
  }
}
