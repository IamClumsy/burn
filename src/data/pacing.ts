/** Pacing knobs. Tune how often things happen here. All times are in seconds. */

/** Seconds before the first boss of a run. */
export const BOSS_FIRST = 360;
/** Gap between bosses: at least BOSS_GAP_MIN, plus a random 0 to BOSS_GAP_SPREAD. */
export const BOSS_GAP_MIN = 420;
export const BOSS_GAP_SPREAD = 240;

export const nextBossGap = (rand: () => number = Math.random): number => BOSS_GAP_MIN + rand() * BOSS_GAP_SPREAD;

/** "7 to 11 minutes", for text that describes the gap. */
export const bossGapText = (): string =>
  `${Math.round(BOSS_GAP_MIN / 60)} to ${Math.round((BOSS_GAP_MIN + BOSS_GAP_SPREAD) / 60)} minutes`;

/** Seymour and Simon each sell at most this many favors in any rolling 24 hours of real time. */
export const FAVORS_PER_DAY = 4;
export const DAY_MS = 24 * 60 * 60 * 1000;
