export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

const SUFFIX = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx"];

export function fmt(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toString();
  let i = 0;
  while (n >= 1000 && i < SUFFIX.length - 1) { n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + SUFFIX[i];
}

export const money = (n: number): string => "$" + fmt(n);
