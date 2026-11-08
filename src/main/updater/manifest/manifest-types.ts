// Manifest shared types [清单共享类型]

/** Asset extraction result [Asset 提取结果] */
export interface AssetExtractionResult {
  zipUrl: string | null;
  manifestUrl: string | null;
  tagName: string | null;
}

/** GitHub release asset object [GitHub Release asset 对象] */
interface ReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

/** GitHub release data object [GitHub Release 数据对象] */
export interface ReleaseData {
  tag_name?: string;
  assets?: ReleaseAsset[];
}
