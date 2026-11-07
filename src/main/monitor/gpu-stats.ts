// GPU stats via platform commands [经平台命令采集 GPU 状态]
//
// Split out [已拆分]：names → gpu-name-read.ts, NVIDIA utilization → gpu-nvidia-read.ts.

import { readGpuNames } from './gpu-name-read.js';
import { readNvidiaStats } from './gpu-nvidia-read.js';
import type { GpuStats } from 'sparklet/shared/types/system';

/** Read GPU names with utilization/memory when available [读取 GPU 名称及可用时的利用率/显存] */
export async function readGpus(): Promise<GpuStats[]> {
  const names = await readGpuNames();
  const nvidia = await readNvidiaStats();
  return names.map((name, i) => {
    const nv = nvidia[i];
    return nv
      ? { name, usage: nv.usage, memoryUsed: nv.memUsed, memoryTotal: nv.memTotal }
      : { name, usage: null, memoryUsed: null, memoryTotal: null };
  });
}
