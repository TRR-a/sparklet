// CodeMirror configuration - language extensions and blue dark theme [CodeMirror 配置 - 语言扩展和蓝色暗色主题]

import {
  EditorView,
  javascript,
  css,
  html,
  json,
  markdown,
  python,
  HighlightStyle,
  syntaxHighlighting,
  t,
} from '../../vendor/codemirror-vendor.bundle.js';
import type { Extension } from '@codemirror/state';

/**
 * Get CodeMirror language extension for a file name [根据文件名获取 CodeMirror 语言扩展]
 */
export function getLanguageExtension(fileName: string): Extension | null {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'ts': case 'tsx': case 'js': case 'jsx': case 'mjs': case 'cjs':
      return javascript({ typescript: ext === 'ts' || ext === 'tsx', jsx: ext === 'tsx' || ext === 'jsx' });
    case 'css': case 'scss': case 'less':
      return css();
    case 'html': case 'htm': case 'svg': case 'xml':
      return html();
    case 'json': case 'jsonc':
      return json();
    case 'md': case 'markdown':
      return markdown();
    case 'py':
      return python();
    default:
      return null;
  }
}

/** Check if a dark-colored theme is active (dark or blue) [检查是否暗色类主题 (dark 或 blue)] */
export function isDarkTheme(): boolean {
  const theme = document.body.getAttribute('data-theme');
  return theme === 'dark' || theme === 'blue';
}

/**
 * Blue dark theme for CodeMirror (VS Code Dark+ inspired, transparent background)
 * [CodeMirror 蓝色暗色主题 (灵感来自 VS Code Dark+，透明背景)]
 */
export const blueTheme = [
  EditorView.theme({
    '&': {
      backgroundColor: 'transparent !important',
      color: '#d4d4d4',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#569cd6',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#569cd6',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(38, 79, 120, 0.6) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent !important',
      color: '#6e7681',
      border: 'none',
      borderRight: '1px solid rgba(128, 128, 128, 0.15)',
    },
    '.cm-gutter': {
      backgroundColor: 'transparent !important',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      color: '#6e7681',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#569cd6',
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(86, 156, 214, 0.2)',
      outline: '1px solid rgba(86, 156, 214, 0.4)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(86, 156, 214, 0.3)',
      outline: '1px solid rgba(86, 156, 214, 0.5)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(86, 156, 214, 0.5)',
    },
    '.cm-tooltip': {
      backgroundColor: '#252526',
      border: '1px solid #3c3c3c',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: 'rgba(86, 156, 214, 0.2)',
        color: '#d4d4d4',
      },
    },
    '.cm-panels': {
      backgroundColor: '#252526',
      color: '#d4d4d4',
    },
    '.cm-panels input': {
      backgroundColor: '#3c3c3c',
      color: '#d4d4d4',
      border: '1px solid #3c3c3c',
    },
  }, { dark: true }),
  syntaxHighlighting(HighlightStyle.define([
    { tag: [t.keyword, t.operatorKeyword, t.modifier, t.controlKeyword, t.moduleKeyword], color: '#569cd6' },
    { tag: [t.definitionKeyword, t.namespace], color: '#c586c0' },
    { tag: [t.name, t.variableName], color: '#9cdcfe' },
    { tag: [t.function(t.variableName), t.labelName], color: '#dcdcaa' },
    { tag: [t.propertyName, t.attributeName], color: '#9cdcfe' },
    { tag: [t.typeName, t.className, t.tagName], color: '#4ec9b0' },
    { tag: [t.number, t.bool, t.null], color: '#b5cea8' },
    { tag: [t.string, t.docString, t.special(t.string)], color: '#ce9178' },
    { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: '#6a9955', fontStyle: 'italic' },
    { tag: [t.angleBracket, t.squareBracket, t.paren, t.brace], color: '#d4d4d4' },
    { tag: [t.operator, t.punctuation, t.separator], color: '#d4d4d4' },
    { tag: [t.regexp, t.escape], color: '#d16969' },
    { tag: [t.meta, t.annotation], color: '#dcdcaa' },
    { tag: [t.heading], color: '#569cd6', fontWeight: 'bold' },
    { tag: [t.quote], color: '#6a9955' },
    { tag: [t.link], color: '#569cd6' },
    { tag: [t.url], color: '#9cdcfe' },
    { tag: [t.atom, t.constant(t.name)], color: '#569cd6' },
    { tag: [t.standard(t.name)], color: '#4ec9b0' },
  ])),
];
