import type { CashPosture } from "../contract/types.ts";

export function postureFromFlags(
  allIn: boolean,
  build: boolean,
  standDownPause: boolean,
  lumpIn: boolean,
  slowIn: boolean,
): CashPosture {
  if (allIn) return "ALL_IN";
  if (build) return "BUILD";
  if (standDownPause) return "STAND_DOWN";
  if (lumpIn) return "LUMP_IN";
  if (slowIn) return "SLOW_IN";
  return "STAY";
}
