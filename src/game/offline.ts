import { S, earn } from "../state";
import { cps } from "../calc";
import { money } from "../util";
import { say } from "../ui/fx";
import { resolveMission } from "./missions";
import { tickBusy, tickNate } from "./tick";
import { tickOrg } from "./org";

/** The longest stretch the game will catch up on in one go. */
export const AWAY_CAP = 24 * 3600;

/**
 * The game kept going while nobody was watching: income at full rate, cooldowns and missions
 * running down, heat and attention cooling off. No bosses show up while you're away.
 * Used when you come back to a closed tab and when a background tab wakes up.
 */
export function catchUp(seconds: number): number {
  const away = Math.min(AWAY_CAP, Math.max(0, seconds));
  if (away <= 0) return 0;
  const e = cps() * away;
  earn(e);
  S.heat = Math.max(0, S.heat - away * 0.5);
  S.att = Math.max(0, S.att - away * 0.05);
  S.layCd = Math.max(0, S.layCd - away);
  S.coverCd = Math.max(0, S.coverCd - away);
  for (const k in S.fx) S.fx[k] = Math.max(0, S.fx[k] - away);
  for (const k in S.allyCd) S.allyCd[k] = Math.max(0, S.allyCd[k] - away);
  if (S.fionaAway > 0) S.fionaAway = Math.max(0, S.fionaAway - away);
  if (!S.boss) S.bossCd = Math.max(30, S.bossCd - away); // a boss can show up soon after you return, never while you're gone
  tickBusy(away);
  tickNate(away);
  tickOrg(away);
  for (const m of [...S.active]) { m.left -= away; if (m.left <= 0) resolveMission(m); }
  return e;
}

/** Say what happened while you were gone, if it was long enough to matter. */
export function welcomeBack(seconds: number, earned: number): void {
  if (seconds < 60) return;
  const mins = Math.round(Math.min(AWAY_CAP, seconds) / 60);
  const t = mins >= 120 ? `${Math.round(mins / 60)} hours` : `${mins} min`;
  say(`You were off the grid ${t}. Your people kept working and earned ${money(earned)} while you were gone.`);
}
