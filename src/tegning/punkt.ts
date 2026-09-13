export function lerretPunkt(
  klientX: number,
  klientY: number,
  ramme: { left: number; top: number; width: number; height: number },
  lerretBredde: number,
  lerretHoyde: number,
): { x: number; y: number } {
  return {
    x: ((klientX - ramme.left) * lerretBredde) / Math.max(1, ramme.width),
    y: ((klientY - ramme.top) * lerretHoyde) / Math.max(1, ramme.height),
  };
}
