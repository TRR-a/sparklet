// Welcome clock: analog hands + tick dots [欢迎页时钟 - 指针与刻度]

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Draw the 12 hour dots on the minimal face once; 12/3/6/9 are larger [一次性绘制钟面 12 个刻度点；12/3/6/9 略大] */
function buildAnalogTicks(): void {
  const g = document.getElementById('analogTicks');
  if (!g || g.childElementCount > 0) return;
  for (let i = 0; i < 12; i++) {
    const angle = ((i * 30 - 90) * Math.PI) / 180; // 0h at 12 o'clock [0 点指向正上方]
    const r = 44;
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(50 + r * Math.cos(angle)));
    dot.setAttribute('cy', String(50 + r * Math.sin(angle)));
    dot.setAttribute('r', i % 3 === 0 ? '2.2' : '1.3');
    dot.setAttribute('class', `analog-dot${i % 3 === 0 ? ' major' : ''}`);
    g.appendChild(dot);
  }
}

/** Draw the 12 hour dots (idempotent; safe to call on init) [绘制 12 个刻度点 (幂等，可在初始化时调用)] */
export function buildAnalogTicksExport(): void {
  buildAnalogTicks();
}

/** Refresh the hour / minute / second hands [刷新时、分、秒指针] */
export function updateAnalogHands(now: Date): void {
  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hour = now.getHours();
  document.getElementById('handHour')?.setAttribute('transform', `rotate(${(hour % 12) * 30 + min * 0.5} 50 50)`);
  document.getElementById('handMinute')?.setAttribute('transform', `rotate(${min * 6 + sec * 0.1} 50 50)`);
  document.getElementById('handSecond')?.setAttribute('transform', `rotate(${sec * 6} 50 50)`);
}
