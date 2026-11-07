// File icon by extension [按扩展名取文件图标]

/**
 * Get icon emoji based on file extension [根据文件扩展名获取图标 emoji]
 */
export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    ts: '📘', tsx: '📘', js: '📒', jsx: '📒',
    py: '🐍', java: '☕', go: '🐹', rs: '🦀',
    c: 'C', cpp: 'C++', h: 'H',
    html: '🌐', css: '🎨', scss: '🎨',
    json: '📋', xml: '📋', yaml: '📋', yml: '📋',
    md: '📝', txt: '📄', pdf: '📕',
    doc: '📘', docx: '📘',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
    mp3: '🎵', wav: '🎵', mp4: '🎬', mov: '🎬',
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
  };
  return iconMap[ext] || '📄';
}
