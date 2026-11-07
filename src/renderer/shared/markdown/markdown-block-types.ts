// Markdown block renderer: shared block-match type [Markdown 块级渲染器 - 共享块匹配类型]

/** Result of a single block attempt [单次块渲染结果] */
export interface BlockMatch {
  /** Rendered HTML [渲染后的 HTML] */
  html: string;
  /** Index of the first line after the block [块之后第一行的索引] */
  next: number;
}
