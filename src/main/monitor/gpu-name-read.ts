// GPU names via platform commands (cached) [经平台命令采集 GPU 名称 (带缓存)]

import { run } from 'sparklet/main/monitor/system-command.js';

let gpuNameCache: string[] | null = null;
let gpuNameCacheAt = 0;

/** GPU names change rarely - fetch once and reuse [GPU 名称几乎不变 - 取一次后复用] */
export async function readGpuNames(): Promise<string[]> {
  if (gpuNameCache && Date.now() - gpuNameCacheAt < 60_000) {
    return gpuNameCache;
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
  gpuNameCache = names;
  gpuNameCacheAt = Date.now();
  return names;
}
