// Welcome logs card [欢迎页日志卡片]

import { systemApi } from '../../../shared/index.js';

// ========== Logs card [日志卡片] ==========
/** Count ERROR / WARN lines in the tail and paint the counts [统计尾部日志中 ERROR / WARN 数量并渲染] */
export async function refreshLogStats(): Promise<void> {
  try {
    const res = await systemApi.tailLogs(500);
    if (!res.success || !res.lines) return;
    let errors = 0;
    let warns = 0;
    for (const line of res.lines) {
      if (line.includes('[ERROR')) errors++;
      else if (line.includes('[WARN')) warns++;
    }
    const errEl = document.getElementById('logErrorCount');
    const warnEl = document.getElementById('logWarnCount');
    if (errEl) errEl.textContent = String(errors);
    if (warnEl) warnEl.textContent = String(warns);
  } catch (err) {
    console.warn('[Kernel] log stats failed:', err);
  }
}

/** Bind the "open logs folder" button [绑定"打开日志文件夹"按钮] */
export function bindLogCard(): void {
  document.getElementById('logOpenBtn')?.addEventListener('click', () => {
    void systemApi.openLogsFolder();
  });
}
