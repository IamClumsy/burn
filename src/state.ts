import type { GameState } from "./types";
import { BOSS_FIRST } from "./data/pacing";

export const SAVE_KEY = "burnedMiamiIdle_v2";

export const fresh = (): GameState => ({
  cash: 0, life: 0, run: 0, heat: 0, att: 0, gens: {}, upgs: {}, cred: 0, last: Date.now(), layCd: 0,
  favors: 0, perks: {}, allies: {}, allyCd: {}, fx: {}, junk: { tape: 0, wire: 0, bleach: 0, micro: 0 },
  cover: "con", coverCd: 0, board: [], active: [], uid: 1, story: 0, ach: [],
  stats: { clicks: 0, burns: 0, mDone: 0, mFail: 0, crafted: 0, ambush: 0, reinstated: 0, time: 0, kidMissions: 0, returned: 0, seymourFavors: 0, simonFavors: 0, errands: 0 },
  buyAmt: 1, mute: false, popups: true, seymourBought: 0, simonBought: 0, nateAway: false, nateTimer: 90, choices: {}, arcStep: {}, arcsDone: {}, grip: 100, listKnown: {}, attPeak: 0, cleanRecord: false, fixer: null, favorLog: { seymour: [], simon: [] }, episodesDone: {}, seasonOpen: 1, busy: null, boss: null, bossCd: BOSS_FIRST, bossKills: {},
});

// Live binding: importers always see the current state object.
export let S: GameState = fresh();
export function setState(next: GameState): void { S = next; }

export function earn(n: number): void { S.cash += n; S.life += n; S.run += n; }

/** Michael keeps this share of what a client pays; the rest goes back to people who need it. */
export const KEEP_RATE = 0.1;

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
  return o;
}
