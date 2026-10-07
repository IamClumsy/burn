import { S, payClient } from "../state";
import { allyFree, heatMult, missionReward, succChance } from "../calc";
import { MISSIONS } from "../data/missions";
import { LINES } from "../data/text";
import { beep, chime } from "../audio";
import { money, pick } from "../util";
import { say, toast } from "../ui/fx";
import type { ActiveMission, Mission } from "../types";

export function newMission(): Mission {
  const t = pick(MISSIONS);
  return { uid: S.uid++, n: t.n, dur: t.dur, succ: t.succ, heat: t.heat, rm: t.rm, fav: t.fav, ally: t.ally, kid: !!t.kid, send: false };
}

export function fillBoard(): void {
  while (S.board.length < 3) S.board.push(newMission());
}

export function startMission(uid: number): void {
  if (S.active.length >= 3) return;
  const i = S.board.findIndex(m => m.uid === uid);
  if (i < 0) return;
  const m = S.board.splice(i, 1)[0];
  const sent = m.send && allyFree(m.ally) ? m.ally : null;
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
    const { keep, returned } = payClient(m.reward); S.favors += m.fav; S.heat += m.heat * heatMult(); S.stats.mDone++;
    if (m.kid) S.stats.kidMissions++;
    say(m.kid ? pick(KID_LINES) : pick(LINES.mOk));
    if (Math.random() < 0.4) say(pick(LINES.returned));
    toast("Mission complete: " + m.n, `Client paid ${money(m.reward)}. You kept ${money(keep)}, returned ${money(returned)}. +${m.fav} favor`);
    chime();
  } else {
    S.heat += m.heat * 1.5 * heatMult(); S.stats.mFail++;
    say(pick(LINES.mBad));
    toast("Mission failed: " + m.n, "Extra heat, no pay.");
    beep(130, 0.3, "sawtooth", 0.06, -50);
  }
}
