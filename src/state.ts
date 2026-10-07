import type { GameState } from "./types";

export const SAVE_KEY = "burnedMiamiIdle_v2";

export const fresh = (): GameState => ({
  cash: 0, life: 0, run: 0, heat: 0, att: 0, gens: {}, upgs: {}, cred: 0, last: Date.now(), layCd: 0,
  favors: 0, perks: {}, allies: {}, allyCd: {}, fx: {}, junk: { tape: 0, wire: 0, bleach: 0, micro: 0 },
  cover: "con", coverCd: 0, board: [], active: [], uid: 1, story: 0, ach: [],
  stats: { clicks: 0, burns: 0, mDone: 0, mFail: 0, crafted: 0, ambush: 0, reinstated: 0, time: 0, kidMissions: 0 },
  buyAmt: 1, mute: false, simonBought: 0, boss: null, bossCd: 150, bossKills: {},
});

// Live binding: importers always see the current state object.
export let S: GameState = fresh();
export function setState(next: GameState): void { S = next; }

export function earn(n: number): void { S.cash += n; S.life += n; S.run += n; }

/** Merge a saved (possibly older) game over fresh defaults so new fields always exist. */
export function merge(saved: Partial<GameState>): GameState {
  const f = fresh();
  const o = Object.assign(f, saved);
  o.stats = Object.assign(fresh().stats, saved.stats || {});
  o.junk = Object.assign(fresh().junk, saved.junk || {});
  return o;
}
