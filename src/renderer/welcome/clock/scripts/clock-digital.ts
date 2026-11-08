// Welcome clock: digital time readout [欢迎页时钟 - 电子时间显示]

import { pad2 } from 'sparklet/renderer/welcome/clock/scripts/clock-format.js';

/** 12-hour format toggle for the digital clock (default 24h) [电子时钟 12 小时制开关 (默认 24 小时制)] */
let use12Hour = false;

/** Enable/disable 12-hour display [启用/关闭 12 小时制] */
export function setUse12Hour(enabled: boolean): void {
  use12Hour = enabled;
}

/** Update the digital clock (HH:MM + seconds + AM/PM in 12h mode) [更新电子时钟 (HH:MM + 秒数，12 小时制附 AM/PM)] */
export function updateDigitalClock(now: Date): void {
  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hour = now.getHours();

  // HH:MM carries the visual weight; seconds tick beside it in muted color [主时间为 HH:MM，秒数以弱色伴随]
  // 12-hour mode: 1-12 without leading zero + AM/PM beside the seconds [12 小时制：1-12 不补零，秒数旁附 AM/PM]
  const digital = document.getElementById('digitalTime');
  if (digital) {
    digital.textContent = use12Hour ? `${hour % 12 || 12}:${pad2(min)}` : `${pad2(hour)}:${pad2(min)}`;
  }
  const secEl = document.getElementById('digitalSec');
  if (secEl) secEl.textContent = `:${pad2(sec)}${use12Hour ? (hour < 12 ? ' AM' : ' PM') : ''}`;
}
