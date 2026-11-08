// NVIDIA GPU utilization via nvidia-smi [经 nvidia-smi 采集 NVIDIA 利用率]

import { run } from 'sparklet/main/monitor/system-command.js';

/** NVIDIA utilization via nvidia-smi (returns [] when unavailable, e.g. non-NVIDIA) [经 nvidia-smi 取 NVIDIA 利用率 (不可用如非 N 卡时返回空)] */
export async function readNvidiaStats(): Promise<Array<{ usage: number; memUsed: number; memTotal: number }>> {
  const out = await run('nvidia-smi', [
    '--query-gpu=utilization.gpu,memory.used,memory.total',
    '--format=csv,noheader,nounits',
  ]);
  if (!out) return [];
  const result: Array<{ usage: number; memUsed: number; memTotal: number }> = [];
  for (const line of out.split('\n')) {
    const cols = line.split(',').map(s => Number(s.trim()));
    if (cols.length >= 3 && cols.every(Number.isFinite)) {
      result.push({ usage: cols[0], memUsed: cols[1] * 1024 * 1024, memTotal: cols[2] * 1024 * 1024 });
    }
  }
  return result;
}
