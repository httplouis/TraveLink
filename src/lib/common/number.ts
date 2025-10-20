// src/lib/common/number.ts
export function toNumOrNull(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
