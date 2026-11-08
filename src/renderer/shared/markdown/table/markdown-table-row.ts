// Markdown table: row parsing [Markdown 表格 - 行解析]

/**
 * Parse table row into cells [将表格行解析为单元格]
 * @param line Table row line [表格行]
 * @returns Array of cell contents [单元格内容数组]
 */
export function parseTableRow(line: string): string[] {
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
export function isTableSeparator(line: string): boolean {
  return /^[|:\s-]+$/.test(line) && line.includes('-') && line.includes('|');
}
