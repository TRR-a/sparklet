// Logger: module-level runtime state [日志 - 模块级运行状态]

import { LEVEL_WEIGHT } from 'sparklet/main/services/logger/logger-format.js';

let minWeight = LEVEL_WEIGHT.info;
let ready = false;

/** Set when the stdout/stderr pipe breaks; console mirroring is then off for good [控制台管道断裂后永久停用镜像] */
let consoleBroken = false;

/** Current minimum level weight [当前最低级别权重] */
export function getMinWeight(): number {
  return minWeight;
}

export function setMinWeight(weight: number): void {
  minWeight = weight;
}

/** Whether the logger finished init [日志是否已初始化完成] */
export function isLoggerReady(): boolean {
  return ready;
}

export function setLoggerReady(value: boolean): void {
  ready = value;
}

/** Whether console mirroring is disabled [控制台镜像是否已停用] */
export function isConsoleBroken(): boolean {
  return consoleBroken;
}

/** Disable console mirroring permanently (stdout/stderr pipe broken) [永久停用控制台镜像 (stdout/stderr 管道断裂)] */
export function markConsoleBroken(): void {
  consoleBroken = true;
}
