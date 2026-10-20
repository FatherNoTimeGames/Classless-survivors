export interface UpgradeMemory { kills: number; aegisIn: number; riposteIn: number; catalystIn: number; benedictionIn: number; pactIn: number }
export function createUpgradeMemory(): UpgradeMemory {
  return { kills: 0, aegisIn: 0, riposteIn: 0, catalystIn: 0, benedictionIn: 0, pactIn: 0 };
}
