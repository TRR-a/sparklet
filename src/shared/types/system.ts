// System monitor types shared between main and renderer [主进程与渲染层共享的系统监控类型]

/** CPU usage snapshot [CPU 使用率快照] */
export interface CpuStats {
  /** Usage percentage 0-100 [使用率百分比 0-100] */
  usage: number;
  /** Logical core count [逻辑核心数] */
  cores: number;
  /** CPU model name [CPU 型号名] */
  model: string;
}

/** Memory usage snapshot [内存使用率快照] */
export interface MemoryStats {
  /** Usage percentage 0-100 [使用率百分比 0-100] */
  usage: number;
  /** Used bytes [已用字节] */
  used: number;
  /** Total bytes [总字节] */
  total: number;
}

/** Single disk/volume usage [单个磁盘/分区使用情况] */
export interface DiskStats {
  /** Mount point or drive letter [挂载点或盘符] */
  mount: string;
  /** Usage percentage 0-100 [使用率百分比 0-100] */
  usage: number;
  /** Used bytes [已用字节] */
  used: number;
  /** Total bytes [总字节] */
  total: number;
}

/** Single GPU snapshot [单个 GPU 快照] */
export interface GpuStats {
  /** GPU name [GPU 名称] */
  name: string;
  /** Usage percentage 0-100, null when unavailable [使用率百分比，无法获取时为 null] */
  usage: number | null;
  /** Used VRAM bytes, null when unavailable [已用显存字节，无法获取时为 null] */
  memoryUsed: number | null;
  /** Total VRAM bytes, null when unavailable [总显存字节，无法获取时为 null] */
  memoryTotal: number | null;
}

/** Aggregated system stats served to the kernel UI [提供给内核 UI 的聚合系统状态] */
export interface SystemStats {
  cpu: CpuStats;
  memory: MemoryStats;
  disks: DiskStats[];
  gpus: GpuStats[];
}
