export function goldShare(btc0: number, btc1: number, gold0: number, gold1: number): number {
  const dBtc = Math.log(btc1) - Math.log(btc0);
  const dGold = Math.log(gold1) - Math.log(gold0);
  const denom = Math.max(-dBtc, 0) + Math.max(dGold, 0);
  return denom === 0 ? 0 : Math.max(dGold, 0) / denom;
}

export function goldFlag(share: number): boolean {
  return share > 0.15;
}
