import { S, KEEP_RATE, capFee, missionCap } from "./state";
import { GENS, OP_CAP } from "./data/ops";
import { UPGS } from "./data/upgrades";
import { COVERS } from "./data/covers";
import { BOSSES } from "./data/bosses";
import { BOWLING, FLASHBACK_BOSSES, SAM_ACTS, SAM_ARC_ID, SAM_BEATS } from "./data/samAxe";
import { STORY } from "./data/story";
import { MISSIONS, seasonOf, seasonsOpen } from "./data/missions";
import { DAY_MS, FAVORS_PER_DAY } from "./data/pacing";
import { GRIP_PERKS, TIERS } from "./data/org";
import { REFERRAL } from "./data/upgrades";
import type { Boss, ChoiceFx, ContactId, Gen, Mission } from "./types";

/** Fx from every story choice the player has made. */
function chosenFx(): ChoiceFx[] {
  const out: ChoiceFx[] = [];
  STORY.forEach((b, i) => {
    const k = S.choices[i];
    if (b.choice && k !== undefined && b.choice.options[k]) out.push(b.choice.options[k].fx);
  });
  SAM_ACTS.forEach((a, i) => { // how Sam told his story
    const k = S.samChoices[i];
    if (k !== undefined && a.options[k]) out.push(a.options[k].fx);
  });
  for (const [step, beat] of Object.entries(SAM_BEATS)) { // and the smaller answers between the acts
    const k = S.samChoices["beat" + step];
    if (k && beat.options[k - 1]) out.push(beat.options[k - 1].fx);
  }
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
export const allyAvailable = (a: { debut?: number; debutEp?: string; gateEp?: boolean }): boolean =>
  (!a.debut || openSeasons() >= a.debut) && (!a.gateEp || !a.debutEp || !!S.episodesDone[a.debutEp]);

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
  if (S.fx.boost > 0) m *= 3;
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
  if (allyHere("fiona")) v *= 1.5;
  if (S.fx.jobs > 0) v *= 6;
  return v * (1 + S.cred * 0.1) * (1 + 0.02 * S.ach.length);
}

/** Everything that scales how fast your operations build heat, with a plain name for each. */
export function heatFactors(): { label: string; v: number }[] {
  const f: { label: string; v: number }[] = [{ label: `Cover: ${cover().name}`, v: cover().heat }];
  if (S.upgs.h1) f.push({ label: "Quiet Methods upgrade", v: 0.6 });
  if (S.allies.sam) f.push({ label: samSharp() ? "Sam's perk (La Barbilla)" : "Sam's perk", v: samSharp() ? 0.75 : 0.85 });
  if (perk("head") > 0) f.push({ label: `Cooler Head perk (level ${perk("head")})`, v: Math.max(0.3, 1 - 0.05 * perk("head")) });
  const c = choiceMult("heat");
  if (c !== 1) f.push({ label: "Your story choices", v: c });
  f.push({ label: `Organization stage: ${tierDef().name}`, v: tierDef().heat });
  return f.filter(x => Math.abs(x.v - 1) > 1e-9 || x.label.startsWith("Cover") || x.label.startsWith("Organization"));
}

/** What a rare gadget costs in cash right now: an hour of your income, never less than a floor. */
export const recipeCash = (r: { cash?: number }): number => (r.cash ? Math.max(5000, cps() * 60 * r.cash) : 0);

export function heatMult(): number {
  if (S.fx.jam > 0 || S.fx.sub > 0) return 0;
  return heatFactors().reduce((m, x) => m * x.v, 1);
}

/** The noise your operations make: each one counts more the further down the list it is. */
export const opsNoise = (): number => GENS.reduce((a, g, i) => a + owned(g.id) * (1 + i * 0.3), 0);
/** Heat built per second by your operations, before the world cools you down. */
export const heatGain = (): number => opsNoise() * 0.012 * heatMult();
export const HEAT_COOLING = 1.2;
/** Net heat change per second (negative means you're cooling). */
export const heatNet = (): number => heatGain() - HEAT_COOLING;

/** Attention built per second: more the hotter you are, scaled by your story choices and how loose their grip is. */
export const attGain = (): number => (S.fx.sub > 0 ? 0 : (0.05 + S.heat * 0.004) * choiceMult("att") * gripAtt());
/** Attention shed per second: only when you're lying low (heat under 20%). */
export const attCooling = (): number => (S.heat < 20 ? 0.25 : 0);
export const attNet = (): number => attGain() - attCooling();

export const layAmt = (): number => (S.upgs.h2 ? 60 : 35);
export const layCdMax = (): number => (S.allies.madeline ? 4 : 8);

/** Everything the jobs paid, counting the 90% Michael hands back, not just his 10%. This is what opens the foes on The List. */
export const grossLife = (): number => S.life + S.stats.returned;

// ---- prices
/** Each one costs 15% more than the last for the first 50, then only 6% more, so the late game stays within reach. */
const R = 1.15, R_LATE = 1.06, KNEE = 50;
export const discount = (): number => 1 - 0.03 * perk("friends");
/** What the k-th operation (counting from 0) costs, before any discount, as a multiple of its base price. */
const priceMult = (k: number): number => k < KNEE ? Math.pow(R, k) : Math.pow(R, KNEE) * Math.pow(R_LATE, k - KNEE);
/** The sum of priceMult over k0, k0+1, ... k0+n-1. */
function multSum(k0: number, n: number): number {
  const end = k0 + n;
  let t = 0;
  if (k0 < KNEE) { const m = Math.min(end, KNEE) - k0; t += Math.pow(R, k0) * (Math.pow(R, m) - 1) / (R - 1); }
  if (end > KNEE) { const from = Math.max(k0, KNEE); t += priceMult(from) * (Math.pow(R_LATE, end - from) - 1) / (R_LATE - 1); }
  return t;
}
export function bulkCost(g: Gen, n: number): number {
  return g.base * multSum(owned(g.id), n) * discount();
}
/** How many of an operation the cash covers (no cap): a search over the closed-form price, since the curve has a bend in it. */
export function maxAfford(g: Gen): number {
  if (S.cash < bulkCost(g, 1)) return 0;
  let lo = 1, hi = 2;
  while (bulkCost(g, hi) <= S.cash && hi < 1e6) { lo = hi; hi *= 2; }
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (bulkCost(g, mid) <= S.cash) lo = mid; else hi = mid; }
  return lo;
}
/** How many of an operation you buy per click: what you asked for, never past the cap (0 once it's maxed). */
export function buyN(g: Gen): number {
  const room = Math.max(0, OP_CAP - owned(g.id));
  if (room === 0) return 0;
  const want = S.buyAmt === "max" ? Math.max(1, maxAfford(g)) : S.buyAmt;
  return Math.min(want, room);
}

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
const CONTACT_PRICING = { seymour: { base: 0.8, grow: 1.12 }, simon: { base: 1.3, grow: 1.15 }, barry: { base: 0.7, grow: 1.1 } } as const;
/** Michael never has that kind of money: whatever your income, a frienemy never asks more than this. */
export const CONTACT_CAP = 100_000;
export const contactPrice = (id: ContactId): number => {
  const { base, grow } = CONTACT_PRICING[id];
  const bought = id === "seymour" ? S.seymourBought : id === "simon" ? S.simonBought : S.barryBought;
  const raw = Math.max(500, cps() * 90) * base * Math.pow(grow, bought);
  return Math.min(CONTACT_CAP, raw) * (S.allies.barry && id !== "barry" ? 0.75 : 1); // Barry's discount comes off the capped price (he doesn't discount himself)
};
/** Favors bought from a frienemy in the last 24 hours of real time. */
export const recentFavors = (id: ContactId, now = Date.now()): number[] =>
  S.favorLog[id].filter(t => now - t < DAY_MS);
/** How many more they'll sell you today. */
export const favorsLeft = (id: ContactId, now = Date.now()): number =>
  Math.max(0, FAVORS_PER_DAY - recentFavors(id, now).length);
/** Milliseconds until they'll sell you another, or 0 if they will now. */
export function nextFavorIn(id: ContactId, now = Date.now()): number {
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
/** The last episode of a Season: the big one, a cliffhanger. */
export const finaleEp = (season: number): string => MISSIONS.filter(t => t.ep && seasonOf(t.ep) === season).map(t => t.ep!).sort().pop() ?? "";
/** In a new game, a Season's finale holds back until every other case of that Season has been done. */
export const finaleHeldBack = (ep: string): boolean =>
  S.seasonGate && ep === finaleEp(seasonOf(ep)) && MISSIONS.some(t => t.ep && t.ep !== ep && seasonOf(t.ep) === seasonOf(ep) && !S.episodesDone[t.ep]);
/** How many episodes of a Season you haven't done yet. */
export const seasonLeft = (season: number): number => MISSIONS.filter(t => t.ep && seasonOf(t.ep) === season && !S.episodesDone[t.ep]).length;
/**
 * How many Seasons are open: by lifetime earnings, except each new Season also needs every case of the one before it done,
 * so nobody skips an episode. A Season you've already reached stays open, so saves from before this rule aren't locked out.
 */
export const openSeasons = (): number => {
  const byMoney = seasonsOpen(S.life);
  if (!S.seasonGate) return byMoney;
  let open = 1;
  for (let s = 2; s <= byMoney; s++) {
    if (s > S.seasonOpen && seasonLeft(s - 1) > 0) break; // the Season before it isn't finished
    open = s;
  }
  return open;
};
/** The Season whose unfinished cases are holding the next one back (you've earned it, but haven't seen everything), or 0. */
export const waitingOn = (): number => {
  const open = openSeasons();
  return seasonsOpen(S.life) > open ? open : 0;
};
/** Hired and actually around: Nate is only here when he hasn't wandered off. */
export const allyHere = (id: string): boolean => !!S.allies[id] && !awayWhy(id);

/** Why an ally isn't around right now, or null if they are. */
export function awayWhy(id: string): { short: string; long: string } | null {
  if (id === "nate" && S.nateAway) return { short: "has wandered off", long: "Wandered off. No idea when he'll be back" };
  if (id === "fiona" && S.boss && bossDef()?.m.includes("snatch")) return { short: "has been taken", long: "Taken by Thomas O'Neill. Win the case to get her back" };
  if (id === "fiona" && S.fionaAway > 0) return S.fionaWhy === "reinstate"
    ? { short: "has gone off on her own for a bit", long: "Off on her own for a bit. She'll be back when she's done" }
    : { short: "is still recovering from being taken", long: "Recovering from being taken, and not happy about it" };
  return null;
}
/** Three cases can run on your own, and a fourth slot only takes a case an ally is helping with. */
export const SOLO_SLOTS = 3, HELP_SLOTS = 1;
export const slotOpen = (helped: boolean): boolean => {
  const withHelp = S.active.filter(m => m.sent).length;
  return S.active.length < SOLO_SLOTS + HELP_SLOTS && (helped || S.active.length - withHelp < SOLO_SLOTS);
};
/** Would this case go out with an ally right now (asked for, or sent by the auto-crew setting)? */
export const wouldBeHelped = (m: { send: boolean; ally: string }): boolean =>
  (m.send || (S.auto.crew && S.cred >= 3 && !!S.allies[m.ally])) && allyFree(m.ally);

export const allyFree = (id: string): boolean => allyHere(id) && !S.active.some(a => a.sent === id);
export function succChance(m: Mission): number {
  if (m.kid) return 1; // Michael never fails when a kid is involved
  const c = m.succ + tierDef().succ + choiceSucc() + (m.arc?.id === SAM_ARC_ID && m.arc.step === 0 && S.samChoices.bowling ? BOWLING.succ : 0) + 0.03 * perk("insider") + (S.allies.jesse ? 0.1 : 0) + (m.send && allyFree(m.ally) ? 0.25 : 0);
  return Math.min(0.97, c);
}
/** What the client pays in total. Michael keeps KEEP_RATE of it. */
export const missionReward = (m: Mission): number => Math.floor(capFee((cps() * 60 + 150) * m.rm * cover().mis * choiceMult("mis") / KEEP_RATE, missionCap(m.rm) * cover().mis * choiceMult("mis")) * (S.fx.pay > 0 ? 2 : 1));
export const missionKeep = (m: Mission): number => missionReward(m) * KEEP_RATE;

// ---- bosses
/** Has the story taken this boss off the board (their Season has opened, or their story beat has passed)? */
const isGhost = (b: Boss): boolean => {
  const g = b.ghost;
  if (!g) return false;
  if (g.from.beat) return S.story > STORY.findIndex(s => s.t === g.from.beat);
  return openSeasons() >= (g.from.season ?? 99);
};
/** The boss as the game should show them now: once they're gone from the story, a Ghost From the Past. */
export const bossView = (b: Boss): Boss => {
  if (!b.ghost || !isGhost(b)) return b;
  const last = b.n.split(" ").slice(-1)[0];
  return {
    ...b,
    n: `Ghosts From the Past: ${b.n}`,
    mech: `Their old playbook still runs: ${b.mech}`,
    intro: b.ghost.legacy,
    file: `${b.file} They're gone now, but what they set in motion keeps turning up.`,
    win: `You close the file on ${b.n} for good. A ghost only stays as long as someone keeps feeding it.`,
    lose: `The file ${last} left behind does its work. A dead man gets the last word again.`,
    lines: [`${last} isn't here. Their paperwork is, and it's thorough.`, "Another old arrangement surfaces, with nobody left to ask about it.", "Some plans outlive the people who made them."],
    listNote: "Gone, but not finished.",
  };
};
export const bossDef = (): Boss | null => { const b = S.boss ? [...BOSSES, ...FLASHBACK_BOSSES].find(x => x.id === S.boss!.id) : undefined; return b ? bossView(b) : null; };

/** Has Sam told the whole story? It sharpens him: a quieter Sam, and a better ability. */
export const samSharp = (): boolean => !!S.arcsDone[SAM_ARC_ID];
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

/** The Fall of Sam Axe is underway (a step is running, its showdown is on, or you're between steps), so the game wears its flashback look. */
export const inFlashback = (): boolean =>
  S.samReplay || !!S.active.some(m => m.arc?.id === SAM_ARC_ID) || !!S.boss?.arc && S.boss.arc.id === SAM_ARC_ID ||
  ((S.arcStep[SAM_ARC_ID] || 0) > 0 && !S.arcsDone[SAM_ARC_ID]);
