// Config directory: result type [配置目录 - 结果类型]

/** Config directory result [配置目录结果] */
export interface ConfigDirResult {
  success: boolean;
  path: string | null;
  error: string | null;
}
