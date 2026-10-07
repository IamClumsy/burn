import { S, KEEP_RATE } from "./state";
import { GENS } from "./data/ops";
import { UPGS } from "./data/upgrades";
import { COVERS } from "./data/covers";
import { BOSSES } from "./data/bosses";
import type { Boss, Gen, Mission } from "./types";

export const owned = (id: string): number => S.gens[id] || 0;
export const totalOps = (): number => GENS.reduce((a, g) => a + owned(g.id), 0);
export const cover = () => COVERS.find(c => c.id === S.cover) || COVERS[0];
export const perk = (id: string): number => S.perks[id] || 0;

export function incomeMult(): number {
  let m = (1 + S.cred * 0.1) * (1 + 0.02 * S.ach.length) * (1 + 0.03 * Object.keys(S.bossKills).length) * cover().inc;
  for (const u of UPGS) if (S.upgs[u.id] && u.kind === "all") m *= u.m!;
  if (S.fx.boost > 0) m *= 2;
  if (allyHere("nate")) m *= 1.15;
  return m;
}

export const genMult = (id: string): number =>
  UPGS.filter(u => S.upgs[u.id] && u.kind === "gen" && u.g === id).reduce((a, u) => a * u.m!, 1);

export function cps(): number {
  let t = 0;
  for (const g of GENS) t += owned(g.id) * g.cps * genMult(g.id);
  return t * incomeMult();
}

export function clickVal(): number {
  const m = UPGS.filter(u => S.upgs[u.id] && u.kind === "click").reduce((a, u) => a * u.m!, 1);
  let v = (1 + cps() * 0.05) * m * cover().job * (1 + 0.25 * perk("cars"));
  if (S.allies.fiona) v *= 1.5;
  if (S.fx.jobs > 0) v *= 4;
  return v * (1 + S.cred * 0.1) * (1 + 0.02 * S.ach.length);
}

export function heatMult(): number {
  if (S.fx.jam > 0) return 0;
  let m = cover().heat;
  if (S.upgs.h1) m *= 0.6;
  if (S.allies.sam) m *= 0.85;
  m *= Math.max(0.3, 1 - 0.05 * perk("head"));
  return m;
}

export const layAmt = (): number => (S.upgs.h2 ? 60 : 35);
export const layCdMax = (): number => (S.allies.madeline ? 4 : 8);

// ---- prices
const R = 1.15;
export const discount = (): number => 1 - 0.03 * perk("friends");
export function bulkCost(g: Gen, n: number): number {
  return g.base * Math.pow(R, owned(g.id)) * discount() * (Math.pow(R, n) - 1) / (R - 1);
}
export function maxAfford(g: Gen): number {
  let n = 0;
  while (n < 500 && bulkCost(g, n + 1) <= S.cash) n++;
  return n;
}
export const buyN = (g: Gen): number => (S.buyAmt === "max" ? Math.max(1, maxAfford(g)) : S.buyAmt);

export const bribeCost = (): number => Math.max(100, cps() * 60) * (S.allies.barry ? 0.5 : 1);
export const seymourPrice = (): number =>
  Math.max(500, cps() * 90) * Math.pow(1.12, S.seymourBought) * (S.allies.barry ? 0.75 : 1);
export const perkCost = (id: string): number => Math.ceil(2 * Math.pow(1.5, perk(id)));
export const credGain = (): number => Math.floor(Math.sqrt(S.run / 1e6));

// ---- missions
/** Hired and actually around: Nate is only here when he hasn't wandered off. */
export const allyHere = (id: string): boolean => !!S.allies[id] && !(id === "nate" && S.nateAway);
export const allyFree = (id: string): boolean => allyHere(id) && !S.active.some(a => a.sent === id);
export function succChance(m: Mission): number {
  if (m.kid) return 1; // Michael never fails when a kid is involved
  const c = m.succ + 0.03 * perk("insider") + (S.allies.jesse ? 0.1 : 0) + (m.send && allyFree(m.ally) ? 0.25 : 0);
  return Math.min(0.97, c);
}
/** What the client pays in total. Michael keeps KEEP_RATE of it. */
export const missionReward = (m: Mission): number => Math.floor((cps() * 60 + 150) * m.rm * cover().mis / KEEP_RATE);
export const missionKeep = (m: Mission): number => missionReward(m) * KEEP_RATE;

// ---- bosses
export const bossDef = (): Boss | null => (S.boss ? BOSSES.find(b => b.id === S.boss!.id) || null : null);
export const bossHP = (b: Boss): number => (cps() * 400 + clickVal() * 200 + 500) * b.hpm;
/** A strike always chews through a real slice of the boss (about 6%, less for tougher bosses). */
export function strikeDmg(): number {
  const base = clickVal() * 8 + cps() * 2;
  const b = S.boss;
  if (!b) return base;
  const hpm = bossDef()?.hpm ?? 1;
  return Math.max(base, b.max * (0.06 / Math.sqrt(hpm)));
}
