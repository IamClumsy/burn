import { S, earn } from "../state";
import { cps } from "../calc";
import { money } from "../util";
import { say } from "../ui/fx";
import { holdNotices, notify, releaseNotices } from "../ui/notice";
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

const span = (mins: number): string => mins >= 120 ? `${Math.round(mins / 60)} hours` : mins >= 60 ? "an hour" : `${mins} min`;

/**
 * Catch up on the time you were away and, if it was long enough to matter, show one card that says what
 * happened. Everything that would have popped up along the way is gathered into that card instead.
 */
export function returnFromAway(seconds: number): void {
  if (seconds < 60) { catchUp(seconds); return; }
  const before = { done: S.stats.mDone, fail: S.stats.mFail, fav: S.favors, nate: S.nateAway };
  holdNotices();
  const earned = catchUp(seconds);
  const news = releaseNotices();
  const won = S.stats.mDone - before.done, lost = S.stats.mFail - before.fail, favors = S.favors - before.fav;
  const lines = [`Your people kept working and earned ${money(earned)}.`];
  if (won + lost > 0) lines.push(`${won + lost} mission${won + lost > 1 ? "s" : ""} finished: ${won} won, ${lost} lost${favors > 0 ? `, +${favors} favor${favors > 1 ? "s" : ""}` : ""}.`);
  if (S.allies.nate && before.nate !== S.nateAway) lines.push(S.nateAway ? "Nate wandered off." : "Nate's back.");
  const other = news.filter(n => !/^Mission (complete|failed)/.test(n.title) && !/^Nate/.test(n.title));
  for (const n of other.slice(0, 4)) lines.push(`${n.title}: ${n.msg}`);
  if (other.length > 4) lines.push(`…and ${other.length - 4} more.`);
  if (seconds > AWAY_CAP) lines.push("Income is only counted for the first 24 hours away.");
  say(`You were off the grid ${span(Math.round(Math.min(seconds, AWAY_CAP) / 60))}. Your people earned ${money(earned)} while you were gone.`);
  notify(`Welcome back: ${span(Math.round(seconds / 60))} away`, lines.join("\n"), "good");
}
