// System monitor - CPU / memory / disk / GPU sampling for the kernel dashboard card
// [系统监控 - 为内核仪表盘卡片采集 CPU/内存/磁盘/GPU]
//
// CPU usage and memory come from the Node `os` module (two CPU samples 200ms apart
// for a delta). Disk and GPU need platform commands, so their results are cached to
// avoid spawning a process every refresh. Cross-platform: Windows + macOS + Linux.
// [CPU 与内存来自 Node `os` 模块 (两次 CPU 采样取差值)。磁盘/GPU 需平台命令，
// 结果做缓存以免每次刷新都拉起进程。跨平台：Windows + macOS + Linux]
//
// CPU sampling in cpu-usage.ts, disks in disk-stats.ts, GPUs in gpu-stats.ts,
// platform command helper in system-command.ts
// [CPU 采样在 cpu-usage.ts，磁盘在 disk-stats.ts，GPU 在 gpu-stats.ts，平台命令辅助在 system-command.ts]

import os from 'os';
import type { SystemStats } from 'sparklet/shared/types/system';
import { sampleCpuUsage } from './cpu-usage.js';
import { readDisks } from './disk-stats.js';
import { readGpus } from './gpu-stats.js';

/** Collect one full system-stats snapshot for the kernel UI [为内核 UI 采集一份完整系统状态快照] */
export async function getSystemStats(): Promise<SystemStats> {
  const cpus = os.cpus();
  const [usage, disks, gpus] = await Promise.all([
    sampleCpuUsage(),
    readDisks(),
    readGpus(),
  ]);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu: {
      usage,
      cores: cpus.length,
      model: cpus[0]?.model.trim() || 'CPU',
    },
    memory: {
      usage: totalMem > 0 ? (usedMem / totalMem) * 100 : 0,
      used: usedMem,
      total: totalMem,
    },
    disks,
    gpus,
  };
}
