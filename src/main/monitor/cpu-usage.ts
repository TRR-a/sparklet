// CPU usage sampling [CPU 使用率采样]

import os from 'os';
import { sleep } from './system-command.js';

/** CPU sampling window in ms [CPU 采样窗口 (毫秒)] */
const CPU_SAMPLE_MS = 200;

interface CpuSnapshot { idle: number; total: number; }

function cpuSnapshot(): CpuSnapshot {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    const times = cpu.times;
    total += times.user + times.nice + times.sys + times.irq + times.idle;
    idle += times.idle;
  }
  return { idle, total };
}

/** CPU usage percentage over a short sampling window [短采样窗口内的 CPU 使用率百分比] */
export async function sampleCpuUsage(): Promise<number> {
  const a = cpuSnapshot();
  await sleep(CPU_SAMPLE_MS);
  const b = cpuSnapshot();
  const idleDiff = b.idle - a.idle;
  const totalDiff = b.total - a.total;
  if (totalDiff <= 0) return 0;
  const usage = (1 - idleDiff / totalDiff) * 100;
  return Math.max(0, Math.min(100, usage));
}
