import { S, KEEP_RATE, capFee, missionCap } from "./state";
import { GENS } from "./data/ops";
import { UPGS } from "./data/upgrades";
import { COVERS } from "./data/covers";
import { BOSSES } from "./data/bosses";
import { STORY } from "./data/story";
import { seasonsOpen } from "./data/missions";
import { DAY_MS, FAVORS_PER_DAY } from "./data/pacing";
import { GRIP_PERKS, TIERS } from "./data/org";
import { REFERRAL } from "./data/upgrades";
import type { Boss, ChoiceFx, Gen, Mission } from "./types";

/** Fx from every story choice the player has made. */
function chosenFx(): ChoiceFx[] {
  const out: ChoiceFx[] = [];
  STORY.forEach((b, i) => {
    const k = S.choices[i];
    if (b.choice && k !== undefined && b.choice.options[k]) out.push(b.choice.options[k].fx);
  });
  return out;
}
export const choiceMult = (key: "inc" | "heat" | "att" | "mis"): number =>
  chosenFx().reduce((m, f) => m * (1 + (f[key] || 0)), 1);
export const choiceSucc = (): number => chosenFx().reduce((s, f) => s + (f.succ || 0), 0);

/** Current Organization attention stage (index into TIERS). */
export function attTier(): number {
  let t = 0;
  TIERS.forEach((x, i) => { if (S.att >= x.min) t = i; });
  return t;
}
export const tierDef = () => TIERS[attTier()];

/** Perks unlocked by wearing down the Organization's grip. */
export const gripPerks = () => GRIP_PERKS.filter(p => S.grip <= p.at);
export const gripInc = (): number => gripPerks().reduce((m, p) => m * (1 + (p.inc || 0)), 1);
export const gripAtt = (): number => gripPerks().reduce((m, p) => m * (1 + (p.att || 0)), 1);
export const gripFixer = (): number => gripPerks().reduce((m, p) => m * (p.fixer ?? 1), 1);

/** Has this ally's season opened yet? Someone who debuts in Season 4 can't be hired in Season 2. */
export const allyAvailable = (debut?: number): boolean => !debut || seasonsOpen(S.life) >= debut;

/** The endless upgrade: every level makes all income a bit bigger, forever. */
export const referralMult = (): number => Math.pow(REFERRAL.gain, S.referrals);
export const referralCost = (): number => REFERRAL.firstCost * Math.pow(REFERRAL.growth, S.referrals);

export const owned = (id: string): number => S.gens[id] || 0;
/** Has this upgrade's requirement been met (owning enough of an operation)? */
export const upgradeUnlocked = (u: { needs?: { gen: string; owned: number } }): boolean =>
  !u.needs || owned(u.needs.gen) >= u.needs.owned;

export const totalOps = (): number => GENS.reduce((a, g) => a + owned(g.id), 0);
export const cover = () => COVERS.find(c => c.id === S.cover) || COVERS[0];
export const perk = (id: string): number => S.perks[id] || 0;

export function incomeMult(): number {
  let m = (1 + S.cred * 0.1) * (1 + 0.02 * S.ach.length) * (1 + 0.03 * Object.keys(S.bossKills).length) * cover().inc;
  for (const u of UPGS) if (S.upgs[u.id] && u.kind === "all") m *= u.m!;
  if (S.fx.boost > 0) m *= 2;
  if (allyHere("nate")) m *= 1.15;
  return m * choiceMult("inc") * gripInc() * (S.cleanRecord ? 1.25 : 1) * referralMult();
}

export const genMult = (id: string): number =>
  UPGS.filter(u => S.upgs[u.id] && u.kind === "gen" && u.g === id).reduce((a, u) => a * u.m!, 1);

/** Odd jobs that bring in a little money with no operations at all. Credibility makes restarts faster. */
export const baseIncome = (): number => 0.3 * (1 + S.cred);

export function cps(): number {
  let t = baseIncome();
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
  return m * choiceMult("heat") * tierDef().heat;
}

export const layAmt = (): number => (S.upgs.h2 ? 60 : 35);
export const layCdMax = (): number => (S.allies.madeline ? 4 : 8);

// ---- prices
const R = 1.15;
export const discount = (): number => 1 - 0.03 * perk("friends");
export function bulkCost(g: Gen, n: number): number {
  return g.base * Math.pow(R, owned(g.id)) * discount() * (Math.pow(R, n) - 1) / (R - 1);
}
/** How many of an operation the cash covers (no cap): closed-form geometric sum, then fix rounding. */
export function maxAfford(g: Gen): number {
  const first = g.base * Math.pow(R, owned(g.id)) * discount();
  if (S.cash < first) return 0;
  let n = Math.floor(Math.log(1 + (S.cash * (R - 1)) / first) / Math.log(R));
  while (n > 0 && bulkCost(g, n) > S.cash) n--;
  while (bulkCost(g, n + 1) <= S.cash && n < 1e6) n++;
  return n;
}
export const buyN = (g: Gen): number => (S.buyAmt === "max" ? Math.max(1, maxAfford(g)) : S.buyAmt);

/**
 * What the current fixer wants. It varies with who's on offer, climbs as the Organization closes in
 * (up to double at full attention), and Barry and a loosened grip bring it down.
 */
export const bribeCost = (): number =>
  Math.max(100, cps() * 60) * (S.fixer?.mult ?? 1) * (1 + S.att / 100) * (S.allies.barry ? 0.5 : 1) * gripFixer();
/** How much attention the current fixer can take off. */
export const bribeDrop = (): number => S.fixer?.drop ?? 40;
/**
 * Each frienemy prices differently. Seymour is cheaper and climbs gently; Simon's intel is higher stakes,
 * so he starts dearer and climbs faster. Both get pricier with each purchase (reset on reinstatement),
 * and Barry negotiates a discount.
 */
const CONTACT_PRICING = { seymour: { base: 0.8, grow: 1.12 }, simon: { base: 1.3, grow: 1.15 } } as const;
/** Michael never has that kind of money: whatever your income, a frienemy never asks more than this. */
export const CONTACT_CAP = 100_000;
export const contactPrice = (id: "seymour" | "simon"): number => {
  const { base, grow } = CONTACT_PRICING[id];
  const bought = id === "seymour" ? S.seymourBought : S.simonBought;
  const raw = Math.max(500, cps() * 90) * base * Math.pow(grow, bought);
  return Math.min(CONTACT_CAP, raw) * (S.allies.barry ? 0.75 : 1); // Barry's discount comes off the capped price
};
/** Favors bought from a frienemy in the last 24 hours of real time. */
export const recentFavors = (id: "seymour" | "simon", now = Date.now()): number[] =>
  S.favorLog[id].filter(t => now - t < DAY_MS);
/** How many more they'll sell you today. */
export const favorsLeft = (id: "seymour" | "simon", now = Date.now()): number =>
  Math.max(0, FAVORS_PER_DAY - recentFavors(id, now).length);
/** Milliseconds until they'll sell you another, or 0 if they will now. */
export function nextFavorIn(id: "seymour" | "simon", now = Date.now()): number {
  const r = recentFavors(id, now);
  return r.length < FAVORS_PER_DAY ? 0 : Math.min(...r) + DAY_MS - now;
}

/** Seymour will take about half in cash if you'll spend the afternoon with him. */
export const hangOutPrice = (): number => contactPrice("seymour") * 0.55;
export const perkCost = (id: string): number => Math.ceil(2 * Math.pow(1.5, perk(id)));
/** Earnings needed in a single run before Reinstate unlocks. Tune pacing here. */
export const REINSTATE_MIN = 1e8;
/** Credibility from a run: zero below the minimum, then the square root of earnings in units of $10M. */
export const credGain = (): number => (S.run < REINSTATE_MIN ? 0 : Math.floor(Math.sqrt(S.run / 1e7)));

// ---- missions
/** Hired and actually around: Nate is only here when he hasn't wandered off. */
export const allyHere = (id: string): boolean => !!S.allies[id] && !(id === "nate" && S.nateAway);
export const allyFree = (id: string): boolean => allyHere(id) && !S.active.some(a => a.sent === id);
export function succChance(m: Mission): number {
  if (m.kid) return 1; // Michael never fails when a kid is involved
  const c = m.succ + tierDef().succ + choiceSucc() + 0.03 * perk("insider") + (S.allies.jesse ? 0.1 : 0) + (m.send && allyFree(m.ally) ? 0.25 : 0);
  return Math.min(0.97, c);
}
/** What the client pays in total. Michael keeps KEEP_RATE of it. */
export const missionReward = (m: Mission): number => Math.floor(capFee((cps() * 60 + 150) * m.rm * cover().mis * choiceMult("mis") / KEEP_RATE, missionCap(m.rm) * cover().mis * choiceMult("mis")));
export const missionKeep = (m: Mission): number => missionReward(m) * KEEP_RATE;

// ---- bosses
export const bossDef = (): Boss | null => (S.boss ? BOSSES.find(b => b.id === S.boss!.id) || null : null);
export const bossHP = (b: Boss): number => (cps() * 400 + clickVal() * 200 + 500) * b.hpm;
/**
 * Progress an action makes against a boss's cover, as a fraction of it (pct). Tougher bosses
 * take proportionally less from each action, and there's always a floor tied to your strength.
 */
export function actionDmg(pct: number): number {
  const base = clickVal() * 8 + cps() * 2;
  const b = S.boss;
  if (!b) return base * (pct / 0.06);
  const hpm = bossDef()?.hpm ?? 1;
  return Math.max(base * (pct / 0.06), b.max * pct / Math.sqrt(hpm));
}

/** Odds that a con works on a boss. */
export function conChance(): number {
  const c = 0.7 + tierDef().succ + choiceSucc() + 0.03 * perk("insider") + (S.allies.jesse ? 0.1 : 0);
  return Math.min(0.95, c);
}
