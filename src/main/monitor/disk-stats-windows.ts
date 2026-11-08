// Disk stats: Windows enumeration [磁盘状态 - Windows 枚举]

import { run } from 'sparklet/main/monitor/system-command.js';
import type { DiskStats } from 'sparklet/shared/types/system.js';

/** Enumerate fixed local drives (DriveType=3) via CIM [经 CIM 枚举本地固定磁盘 (DriveType=3)] */
export async function readWindowsDisks(): Promise<DiskStats[]> {
  // Fixed local drives only (DriveType=3) [仅本地固定磁盘 (DriveType=3)]
  const out = await run('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    "Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,Size,FreeSpace | ConvertTo-Json -Compress",
  ]);
  try {
    const parsed = JSON.parse(out.startsWith('[') ? out : `[${out}]`);
    return parsed
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
  } catch {
    return [];
  }
}
