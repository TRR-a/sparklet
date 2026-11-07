// Markdown highlighter: pattern table [Markdown 高亮 - 模式表]

/** Block-level patterns [块级模式] */
export const MD_FENCE = /^```\s*(\w*)/;
export const MD_HEADING = /^#{1,6}\s+/;
export const MD_HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
export const MD_SETEXT = /^\s*={3,}\s*$/;
export const MD_QUOTE = /^(\s*>\s?)(.*)$/;
export const MD_LIST = /^(\s*)([-*+]|\d+\.)(\s+)/;
/** Table separator row: only pipe/colon/dash/space with a --- run [表格分隔行：仅含 | : - 空格] */
export const MD_TABLE_SEP = /^[|:\-\s]+$/;

/** Inline patterns: code, bold, italic, strikethrough, image, link, bare URL [行内模式：代码、粗体、斜体、删除线、图片、链接、裸 URL] */
export const MD_INLINE = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_|~~([^~\n]+)~~|!\[([^\]\n]*)\]\(([^)\n]+)\)|\[([^\]\n]*)\]\(([^)\n]+)\)|(https?:\/\/[^\s)]+)/g;
