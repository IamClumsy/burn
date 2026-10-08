import type { GameState } from "./types";
import { BOSS_FIRST } from "./data/pacing";

export const SAVE_KEY = "burnedMiamiIdle_v2";

export const fresh = (): GameState => ({
  cash: 0, life: 0, run: 0, heat: 0, att: 0, gens: {}, upgs: {}, cred: 0, last: Date.now(), layCd: 0,
  favors: 0, perks: {}, allies: {}, allyCd: {}, fx: {}, junk: { tape: 0, wire: 0, bleach: 0, micro: 0 },
  cover: "con", coverCd: 0, board: [], active: [], uid: 1, story: 0, ach: [],
  stats: { clicks: 0, burns: 0, mDone: 0, mFail: 0, crafted: 0, ambush: 0, reinstated: 0, time: 0, kidMissions: 0, returned: 0, seymourFavors: 0, simonFavors: 0, errands: 0 },
  buyAmt: 1, mute: false, sci: false, popups: true, seymourBought: 0, simonBought: 0, nateAway: false, nateTimer: 90, nateStage: 0, fionaAway: 0, backupNudged: false, choices: {}, arcStep: {}, arcsDone: {}, grip: 100, listKnown: {}, attPeak: 0, cleanRecord: false, fixer: null, referrals: 0, favorLog: { seymour: [], simon: [] }, episodesDone: {}, seasonOpen: 1, busy: null, boss: null, bossCd: BOSS_FIRST, bossKills: {},
});

// Live binding: importers always see the current state object.
export let S: GameState = fresh();
export function setState(next: GameState): void { S = next; }

/** The most any total can reach. Far past anything playable, but it keeps every number finite. */
export const NUM_CAP = 1e300;

export function earn(n: number): void {
  if (!Number.isFinite(n) || n <= 0) return;
  S.cash = Math.min(NUM_CAP, S.cash + n); S.life = Math.min(NUM_CAP, S.life + n); S.run = Math.min(NUM_CAP, S.run + n);
}

/** Michael keeps this share of what a client pays; the rest goes back to people who need it. */
export const KEEP_RATE = 0.1;

/**
 * Michael's clients are ordinary people, so a fee never gets silly however rich his network is.
 * Anything up to half the cap passes through exactly as is; beyond that it eases smoothly toward the cap
 * and never passes it. (The two halves meet with the same slope, so there's no visible kink.)
 */
export const FEE_CAP = 100_000;
export function capFee(raw: number, cap = FEE_CAP): number {
  const knee = cap / 2;
  return raw <= knee ? raw : cap * (1 - 0.5 * Math.exp(-(raw - knee) / knee));
}
/**
 * Each mission has its own ceiling: harder cases (a bigger multiplier) are allowed to pay more, up to FEE_CAP.
 * Cover and story bonuses to mission pay lift it a little, so those perks still matter late on.
 */
export const missionCap = (rm: number): number => Math.min(FEE_CAP, 15_000 * rm);

/** Pay out a client's fee: Michael keeps 10%, the rest is returned. */
export function payClient(gross: number): { keep: number; returned: number } {
  const keep = gross * KEEP_RATE;
  const returned = gross - keep;
  earn(keep);
  S.stats.returned += returned;
  return { keep, returned };
}

/** Merge a saved (possibly older) game over fresh defaults so new fields always exist. */
export function merge(saved: Partial<GameState>): GameState {
  const f = fresh();
  const o = Object.assign(f, saved);
  o.stats = Object.assign(fresh().stats, saved.stats || {});
  o.junk = Object.assign(fresh().junk, saved.junk || {});
  // A damaged or hand-edited save can't poison the game with NaN or Infinity.
  const d = fresh() as unknown as Record<string, unknown>, r = o as unknown as Record<string, unknown>;
  for (const k of Object.keys(d)) {
    if (typeof d[k] === "number" && (typeof r[k] !== "number" || !Number.isFinite(r[k] as number))) r[k] = d[k];
  }
  for (const k of ["cash", "life", "run"] as const) o[k] = Math.min(NUM_CAP, Math.max(0, o[k]));
  return o;
}
