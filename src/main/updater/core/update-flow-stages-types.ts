// Update flow: phase shared types [更新流程 - 阶段共享类型]

/** Artifacts to clean up on later failure [后续失败时需要清理的产物] */
export interface FlowArtifacts {
  zipPath: string | null;
  tempDir: string | null;
  isManualDir: boolean;
}

/** Inputs carried over from the check phase [从检查阶段带入的参数] */
export interface InstallPhaseInput {
  currentVersion: string;
  latestVersion: string;
  zipUrl: string | null;
  manifestUrl: string | null;
}
