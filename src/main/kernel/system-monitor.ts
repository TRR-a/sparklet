// System monitor - CPU / memory / disk / GPU sampling for the kernel dashboard card
// [系统监控 - 为内核仪表盘卡片采集 CPU/内存/磁盘/GPU]
//
// CPU usage and memory come from the Node `os` module (two CPU samples 200ms apart
// for a delta). Disk and GPU need platform commands, so their results are cached to
// avoid spawning a process every refresh. Cross-platform: Windows + macOS + Linux.
// [CPU 与内存来自 Node `os` 模块 (两次 CPU 采样取差值)。磁盘/GPU 需平台命令，
// 结果做缓存以免每次刷新都拉起进程。跨平台：Windows + macOS + Linux]

import os from 'os';
import { execFile } from 'child_process';
import type { SystemStats, DiskStats, GpuStats } from '../../shared/types/system';

/** CPU sampling window in ms [CPU 采样窗口 (毫秒)] */
const CPU_SAMPLE_MS = 200;

/** How long disk/GPU command results stay cached (ms) [磁盘/GPU 命令结果缓存时长 (毫秒)] */
const SLOW_CACHE_TTL_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Run a command without a shell, resolve stdout (never throws - returns '' on error) [不经 shell 执行命令，返回 stdout (不抛错，失败返回空串)] */
function run(cmd: string, args: string[]): Promise<string> {
  return new Promise(resolve => {
    execFile(cmd, args, { timeout: 4000, windowsHide: true, maxBuffer: 1024 * 1024 }, (err, stdout) => {
      if (err) { resolve(''); return; }
      resolve(typeof stdout === 'string' ? stdout : '');
    });
  });
}

// ==================== CPU [CPU] ====================

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
async function sampleCpuUsage(): Promise<number> {
  const a = cpuSnapshot();
  await sleep(CPU_SAMPLE_MS);
  const b = cpuSnapshot();
  const idleDiff = b.idle - a.idle;
  const totalDiff = b.total - a.total;
  if (totalDiff <= 0) return 0;
  const usage = (1 - idleDiff / totalDiff) * 100;
  return Math.max(0, Math.min(100, usage));
}

// ==================== Disk [磁盘] ====================

let diskCache: DiskStats[] | null = null;
let diskCacheAt = 0;

async function readDisks(): Promise<DiskStats[]> {
  if (diskCache && Date.now() - diskCacheAt < SLOW_CACHE_TTL_MS) return diskCache;
  const platform = process.platform;
  let disks: DiskStats[] = [];

  if (platform === 'win32') {
    // Fixed local drives only (DriveType=3) [仅本地固定磁盘 (DriveType=3)]
    const out = await run('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      "Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,Size,FreeSpace | ConvertTo-Json -Compress",
    ]);
    try {
      const parsed = JSON.parse(out.startsWith('[') ? out : `[${out}]`);
      disks = parsed
        .filter((d: { Size?: number }) => (d.Size ?? 0) > 0)
        .map((d: { DeviceID: string; Size: number; FreeSpace: number }) => {
          const total = Number(d.Size);
          const free = Number(d.FreeSpace);
          return {
            mount: d.DeviceID,
            used: total - free,
            total,
            usage: total > 0 ? ((total - free) / total) * 100 : 0,
          };
        });
    } catch { disks = []; }
  } else {
    // POSIX `df -Pk`: 1024-block columns, predictable layout [POSIX `df -Pk`：1024 块列，布局稳定]
    const out = await run('df', ['-Pk']);
    const lines = out.split('\n').slice(1);
    for (const line of lines) {
      const cols = line.trim().split(/\s+/);
      if (cols.length < 6) continue;
      const fs_ = cols[0];
      // Skip pseudo/virtual filesystems [跳过伪/虚拟文件系统]
      if (!fs_.startsWith('/') || fs_.startsWith('/dev/loop')) continue;
      const total = Number(cols[1]) * 1024;
      const used = Number(cols[2]) * 1024;
      const mount = cols[5];
      if (!Number.isFinite(total) || total <= 0) continue;
      disks.push({ mount, used, total, usage: total > 0 ? (used / total) * 100 : 0 });
    }
  }

  diskCache = disks;
  diskCacheAt = Date.now();
  return disks;
}

// ==================== GPU [GPU] ====================

let gpuNameCache: GpuStats[] | null = null;
let gpuNameCacheAt = 0;

/** GPU names change rarely - fetch once and reuse [GPU 名称几乎不变 - 取一次后复用] */
async function readGpuNames(): Promise<string[]> {
  if (gpuNameCache && Date.now() - gpuNameCacheAt < 60_000) {
    return gpuNameCache.map(g => g.name);
  }
  let names: string[] = [];
  if (process.platform === 'win32') {
    const out = await run('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      '(Get-CimInstance Win32_VideoController).Name',
    ]);
    names = out.split('\n').map(s => s.trim()).filter(Boolean);
  } else if (process.platform === 'darwin') {
    const out = await run('system_profiler', ['SPDisplaysDataType']);
    names = [...out.matchAll(/Chipset Model:\s*(.+)/g)].map(m => m[1].trim());
  } else {
    const out = await run('lspci', []);
    names = [...out.matchAll(/(?:VGA compatible controller|3D controller):\s*(.+)/g)].map(m => m[1].trim());
  }
  // Filter out virtual/remote display adapters (Indirect Display Driver, remote desktop) [过滤虚拟/远程显示适配器 (间接显示驱动、远程桌面)]
  const VIRTUAL_GPU = /idd|virtual|remote|parsec|teamviewer|oray|splashtop|anydesk|mirage|usbmmidd/i;
  const realNames = names.filter(n => !VIRTUAL_GPU.test(n));
  if (realNames.length > 0) names = realNames;
  if (names.length === 0) names = ['GPU'];
  gpuNameCache = names.map(name => ({ name, usage: null, memoryUsed: null, memoryTotal: null }));
  gpuNameCacheAt = Date.now();
  return names;
}

/** NVIDIA utilization via nvidia-smi (returns [] when unavailable, e.g. non-NVIDIA) [经 nvidia-smi 取 NVIDIA 利用率 (不可用如非 N 卡时返回空)] */
async function readNvidiaStats(): Promise<Array<{ usage: number; memUsed: number; memTotal: number }>> {
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

async function readGpus(): Promise<GpuStats[]> {
  const names = await readGpuNames();
  const nvidia = await readNvidiaStats();
  return names.map((name, i) => {
    const nv = nvidia[i];
    return nv
      ? { name, usage: nv.usage, memoryUsed: nv.memUsed, memoryTotal: nv.memTotal }
      : { name, usage: null, memoryUsed: null, memoryTotal: null };
  });
}

// ==================== Aggregate [聚合] ====================

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
