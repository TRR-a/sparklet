// Rollback dialogs: error details block [回滚弹窗 - 错误详情块]

import { escapeHtml } from '../../ui/dom/dom-utils.js';

/** Build the collapsible error details block (empty when no errors) [构建可折叠错误详情块 (无错误时为空)] */
export function rollbackErrorsBlock(errs: string[], label: string): string {
  return errs.length > 0 ? `
          <details style="margin-top:10px;"><summary style="cursor:pointer;color:#666;">${label}</summary>
            <pre style="margin:6px 0 0;padding:8px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;white-space:pre-wrap;word-break:break-all;font-size:12px;">${escapeHtml(errs.join('\n'))}</pre>
          </details>` : '';
}
