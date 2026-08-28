// Markdown renderers - block-level, inline, and table rendering [Markdown 渲染器 - 块级、行内和表格渲染]

import { escapeHtml } from '../Base/dom-utils.js';

/**
 * Render block-level elements [渲染块级元素]
 * @param text Text to process [待处理文本]
 * @returns HTML string [HTML 字符串]
 */
export function renderBlocks(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines [跳过空行]
    if (!trimmed) { i++; continue; }

    // Heading [标题 # ~ ######]
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      result.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule [分割线 --- *** ___]
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      result.push('<hr>');
      i++;
      continue;
    }

    // Blockquote [引用块 > text]
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      result.push(`<blockquote>${renderInline(quoteLines.join('\n')).replace(/\n/g, '<br>')}</blockquote>`);
      continue;
    }

    // Task list [任务列表 - [x] item]
    const taskMatch = trimmed.match(/^[-*]\s+\[([x ])\]\s+(.+)$/i);
    if (taskMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const tm = lines[i].trim().match(/^[-*]\s+\[([x ])\]\s+(.+)$/i);
        if (!tm) break;
        const isChecked = tm[1].toLowerCase() === 'x';
        items.push(`<li class="task-item${isChecked ? ' checked' : ''}"><span class="task-checkbox">${isChecked ? '\u2611' : '\u2610'}</span> ${renderInline(tm[2])}</li>`);
        i++;
      }
      result.push(`<ul class="task-list">${items.join('')}</ul>`);
      continue;
    }

    // Unordered list [无序列表 - item / * item]
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^[-*]\s+/, '');
        items.push(`<li>${renderInline(item)}</li>`);
        i++;
      }
      result.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list [有序列表 1. item]
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push(`<li>${renderInline(item)}</li>`);
        i++;
      }
      result.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Table [表格 | a | b |]
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1].trim())) {
      const tableLines: string[] = [trimmed];
      i++;
      tableLines.push(lines[i].trim()); // separator line [分隔行]
      i++;
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim()) {
        tableLines.push(lines[i].trim());
        i++;
      }
      result.push(renderTable(tableLines));
      continue;
    }

    // Paragraph [段落]
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i].trim())) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      result.push(`<p>${renderInline(paraLines.join('\n')).replace(/\n/g, '<br>')}</p>`);
    }
  }

  return result.join('');
}

/**
 * Render inline formatting [渲染行内格式]
 * @param text Text to process [待处理文本]
 * @returns HTML string with inline formatting [带行内格式的 HTML 字符串]
 */
export function renderInline(text: string): string {
  let result = escapeHtml(text);

  // Extract inline code first (prevent inner formatting) [先提取行内代码 (防止内部被格式化)]
  const codePlaceholders: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_match: string, code: string) => {
    codePlaceholders.push(code);
    return `\x00CODE${codePlaceholders.length - 1}\x00`;
  });

  // Images (must be before links) [图片 (必须在链接之前)]
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img">');

  // Links [链接]
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Bold [粗体 **text**]
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Strikethrough [删除线 ~~text~~]
  result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Italic [斜体 *text*] - avoid matching ** (bold) [避免匹配 ** (粗体)]
  result = result.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');

  // Restore inline code [恢复行内代码]
  result = result.replace(/\x00CODE(\d+)\x00/g, (_match: string, idx: string) => `<code class="inline-code">${codePlaceholders[parseInt(idx)]}</code>`);

  return result;
}

/**
 * Render table from parsed lines [从解析行渲染表格]
 * @param lines Table lines: [header, separator, ...rows] [表格行：表头、分隔行、数据行]
 * @returns Table HTML [表格 HTML]
 */
function renderTable(lines: string[]): string {
  const header = parseTableRow(lines[0]);
  const separator = lines[1];

  // Parse alignment from separator [从分隔行解析对齐方式]
  const aligns = parseTableRow(separator).map((cell: string) => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left';
  });

  let html = '<table class="md-table"><thead><tr>';
  header.forEach((cell: string, idx: number) => {
    const align = aligns[idx] || 'left';
    html += `<th style="text-align:${align}">${renderInline(cell)}</th>`;
  });
  html += '</tr></thead><tbody>';

  for (let i = 2; i < lines.length; i++) {
    const cells = parseTableRow(lines[i]);
    html += '<tr>';
    cells.forEach((cell: string, idx: number) => {
      const align = aligns[idx] || 'left';
      html += `<td style="text-align:${align}">${renderInline(cell)}</td>`;
    });
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

/**
 * Parse table row into cells [将表格行解析为单元格]
 * @param line Table row line [表格行]
 * @returns Array of cell contents [单元格内容数组]
 */
function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((cell: string) => cell.trim());
}

/**
 * Check if line is a table separator [检查行是否为表格分隔行]
 * @param line Line to check [待检查行]
 * @returns True if separator [是分隔行则返回 true]
 */
function isTableSeparator(line: string): boolean {
  return /^[|:\s-]+$/.test(line) && line.includes('-') && line.includes('|');
}

/**
 * Check if line starts a block-level element [检查行是否为块级元素开始]
 * @param line Line to check [待检查行]
 * @returns True if block start [是块级元素则返回 true]
 */
function isBlockStart(line: string): boolean {
  return /^(#{1,6})\s+/.test(line) ||
         /^[-*]\s+/.test(line) ||
         /^\d+\.\s+/.test(line) ||
         /^>/.test(line) ||
         /^(-{3,}|\*{3,}|_{3,})$/.test(line);
}
