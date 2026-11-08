// Updater manifest types [更新清单类型]

/** Manifest entry [清单条目] */
export interface ManifestEntry {
  version: string;
  internalCodename?: string;
  description?: string;
  license?: string;
  releaseDate?: string;
  packageHash?: string;
  exeHash?: string;
  filesHash?: string;
  hash?: string;
}
