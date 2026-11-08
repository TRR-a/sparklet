// C-style highlighter: word classification [C 风格高亮 - 单词归类]

import type { CStyleDialect } from './highlight-cstyle-dialects.js';

/**
 * Classify a word token into an hljs class, or null when it should stay plain
 * [把单词词元归类为 hljs 类名，无需着色时返回 null]
 * @param after First non-space char following the word [单词后第一个非空白字符]
 */
export function classifyCStyleWord(
  tok: string,
  prevWord: string,
  after: string,
  dialect: CStyleDialect
): string | null {
  if (tok.startsWith('@')) {
    return 'hljs-meta';                        // decorator / at-rule
  }
  if (tok.startsWith('#')) {
    return 'hljs-symbol';                      // CSS id selector
  }
  if (dialect.cssSelectors && tok.startsWith('.')) {
    return 'hljs-symbol';                      // CSS class selector
  }
  if (dialect.keywords.has(tok)) {
    return 'hljs-keyword';
  }
  if (dialect.builtins.has(tok)) {
    return 'hljs-built_in';
  }
  if (dialect.types.has(tok)) {
    return 'hljs-type';
  }
  if (dialect.titleAfter.has(prevWord)) {
    return 'hljs-title';                       // class / interface / enum name
  }
  if (after === '(') {
    return 'hljs-title';                       // function call
  }
  if (after === ':') {
    return 'hljs-attr';                        // css property / ts label
  }
  return null;
}
