export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** Pick one at random, where each item's chance is proportional to its weight. */
export function weightedPick<T>(list: readonly T[], weight: (t: T) => number): T {
  const w = list.map(weight);
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= w[i]; if (r < 0) return list[i]; }
  return list[list.length - 1];
}

const SUFFIX = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

/** Show big numbers as 1.23e9 instead of 1.23B. A display choice only; nothing in the game changes. */
let scientific = false;
export const setScientific = (on: boolean): void => { scientific = on; };

export function fmt(n: number): string {
  if (Number.isNaN(n)) return "0";
  if (!isFinite(n)) return "∞";
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toString();
  if (scientific || n >= 1e36) {
    const e = Math.floor(Math.log10(n));
    return (n / 10 ** e).toFixed(2) + "e" + e;
  }
  let i = 0;
  while (n >= 1000 && i < SUFFIX.length - 1) { n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + SUFFIX[i];
}

export const money = (n: number): string => "$" + fmt(n);

/** "5h 12m", "42m" or "30s", for how long until something is ready. */
export function formatWait(ms: number): string {
  const s = Math.max(1, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.ceil(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}
