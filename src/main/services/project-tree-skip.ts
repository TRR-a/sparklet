// Project tree reader: skip list & depth limit [项目树读取 - 跳过目录与深度上限]

/** Directories to skip when scanning [扫描时跳过的目录] */
export const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build',
  '.next', '.nuxt', '.cache', '.vscode', '.idea',
  '__pycache__', '.venv', 'venv', 'env',
  'target', 'bin', 'obj',
]);

/** Max recursion depth [最大递归深度] */
export const MAX_DEPTH = 8;
