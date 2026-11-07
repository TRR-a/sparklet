// Project file: extension sets [项目文件 - 扩展名集合]

/** Image extensions [图片扩展名] */
export const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico']);

/** Binary file extensions (never preview as text) [二进制文件扩展名 (绝不作为文本预览)] */
export const BINARY_EXTS = new Set([
  'dll', 'pak', 'exe', 'bin', 'so', 'dylib', 'class', 'pyc', 'pyo',
  'o', 'obj', 'lib', 'a', 'dll', 'sys', 'drv', 'efi',
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst',
  'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac',
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'wasm', 'node', 'dat', 'db', 'sqlite', 'sqlite3',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', // images handled separately but also binary
  'psd', 'ai', 'sketch', 'fig',
]);
