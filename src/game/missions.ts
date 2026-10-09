import { S, payClient } from "../state";
import { allyFree, awayWhy, heatMult, missionReward, succChance } from "../calc";
import { MISSIONS, missionUnlocked, seasonOf, seasonsOpen } from "../data/missions";
import { LINES } from "../data/text";
import { beep, chime } from "../audio";
import { money, pick } from "../util";
import { say, toast } from "../ui/fx";
import { advanceArc, failArcStep } from "./arcs";
import { reduceGrip } from "./org";
import { EP_NOTES, outcomeLine } from "../data/episodeNotes";
import type { ActiveMission, Mission } from "../types";

/**
 * How likely a case is to turn up. Episodes you haven't done yet come up far more often than ones you have,
 * and cases from the Season you're in come up most of all, so a season is possible to finish.
 */
export function missionWeight(t: { ep?: string }): number {
  const unseen = t.ep ? !S.episodesDone[t.ep] : false;
  const current = t.ep ? seasonOf(t.ep) === seasonsOpen(S.life) : false;
  return (unseen ? 4 : 1) * (current ? 3 : 1);
}

function weightedMission<T extends { ep?: string }>(list: T[]): T {
  const weights = list.map(missionWeight);
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= weights[i]; if (r < 0) return list[i]; }
  return list[list.length - 1];
}

export function newMission(): Mission {
  // Only seasons you've unlocked, and nothing that's already on the board or running.
  const open = MISSIONS.filter(t => missionUnlocked(t, S.life));
  const fresh = open.filter(t => !S.board.some(m => m.n === t.n) && !S.active.some(m => m.n === t.n));
  const t = weightedMission(fresh.length ? fresh : open);
  return {
    uid: S.uid++, n: t.n, dur: t.dur, succ: t.succ, heat: t.heat, rm: t.rm, fav: t.fav, ally: t.ally,
    kid: !!t.kid, elder: !!t.elder, send: false, ep: t.ep, epTitle: t.epTitle,
  };
}

export function fillBoard(): void {
  while (S.board.length < 3) S.board.push(newMission());
}

export function startMission(uid: number): void {
  if (S.active.length >= 3) return;
  const i = S.board.findIndex(m => m.uid === uid);
  if (i < 0) return;
  if (awayWhy(S.board[i].ally)) return; // a mission built around someone can't start while they're away
  const m = S.board.splice(i, 1)[0];
  const wantsHelp = m.send || (S.auto.crew && S.cred >= 3 && !!S.allies[m.ally]); // auto-send crew
  const sent = wantsHelp && allyFree(m.ally) ? m.ally : null;
  S.active.push({ ...m, sent, left: m.dur, chance: succChance(m), reward: missionReward(m) });
  fillBoard();
  beep(400, 0.08, "triangle", 0.05);
}

const KID_LINES = [
  "Kids are the one job that never goes wrong. It's not luck; it's a rule.",
  "You don't lose when there's a kid involved. You just don't.",
];

export function resolveMission(m: ActiveMission): void {
  S.active = S.active.filter(x => x.uid !== m.uid);
  S.att = Math.min(100, S.att + 8);
  if (Math.random() < m.chance) {
    payClient(m.reward); S.favors += m.fav; S.heat += m.heat * heatMult(); S.stats.mDone++;
    if (m.kid) S.stats.kidMissions++;
    if (m.kid && m.sent) { S.favors += 1; say("Having the right person along made all the difference. +1 favor."); }
    if (m.arc) advanceArc(m.arc.id, m.arc.step);
    if (m.ep) S.episodesDone[m.ep] = true;
    reduceGrip(1);
    say(m.kid ? pick(KID_LINES) : pick(LINES.mOk));
    const note = m.ep ? EP_NOTES[m.ep] : undefined;
    const won = outcomeLine(note, true, pick);
    if (won) say(won);
    if (note) say("Spy tip: " + note.tip);
    if (Math.random() < 0.4) say(pick(LINES.returned));
    toast("Mission complete: " + m.n, `Paid ${money(m.reward)}. Expenses covered, the rest went back to the people who needed it. +${m.fav} favor`, "good");
    chime();
  } else {
    S.heat += m.heat * 1.5 * heatMult(); S.stats.mFail++;
    if (m.arc) failArcStep(m.arc.id);
    say(pick(LINES.mBad));
    const lost = outcomeLine(m.ep ? EP_NOTES[m.ep] : undefined, false, pick);
    if (lost) say(lost);
    toast("Mission failed: " + m.n, "Extra heat, no pay.", "bad");
    beep(130, 0.3, "sawtooth", 0.06, -50);
  }
}
