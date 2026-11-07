// Welcome clock: month grid cell [欢迎页时钟 - 月历单元格]

/** Create one month-grid cell with highlight / click wiring [创建一个带高亮与点击接线的月历单元格] */
export function buildMonthCell(
  day: number,
  now: Date,
  selectedDay: number | null,
  onSelectDay: (day: number) => void
): HTMLSpanElement {
  const cell = document.createElement('span');
  const isToday = day === now.getDate();
  const isSelected = selectedDay === day;
  cell.className = 'calendar-day';
  // Before any selection: today is filled blue. After selecting another day:
  // today keeps a blue ring, the picked day gets a grey fill, others are muted.
  // [未选中时今天蓝色填充；选中其他日后今天保留蓝描边，被选日灰色填充，其余弱色]
  if (selectedDay === null) {
    if (isToday) cell.classList.add('today');
    else cell.classList.add('normal');
  } else {
    if (isToday) cell.classList.add('today-ring');
    else if (isSelected) cell.classList.add('selected');
    else cell.classList.add('normal');
  }
  cell.textContent = String(day);
  cell.style.cursor = 'pointer';
  cell.addEventListener('click', () => {
    onSelectDay(day);
  });
  return cell;
}

/** Create one blank (adjacent-month) cell [创建一个空白 (相邻月份) 单元格] */
export function buildBlankCell(text: string): HTMLSpanElement {
  const cell = document.createElement('span');
  cell.className = 'calendar-day muted';
  cell.textContent = text;
  return cell;
}
