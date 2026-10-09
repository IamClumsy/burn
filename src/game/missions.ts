import { S, payClient } from "../state";
import { allyFree, awayWhy, heatMult, inFlashback, openSeasons, slotOpen, waitingOn, wouldBeHelped, missionReward, succChance } from "../calc";
import { MISSIONS, episodeOf, missionUnlocked, seasonOf } from "../data/missions";
import { LINES } from "../data/text";
import { beep, chime } from "../audio";
import { money, pick, weightedPick } from "../util";
import { say, toast, type NarrationMeta } from "../ui/fx";
import { advanceArc, failArcStep } from "./arcs";
import { ALLIES } from "../data/allies";
import { crewCut } from "../data/automation";
import { reduceGrip } from "./org";
import { EP_NOTES, outcomeLine } from "../data/episodeNotes";
import type { ActiveMission, Mission } from "../types";

/**
 * How likely a case is to turn up. Episodes you haven't done yet come up far more often than ones you have,
 * and cases from the Season you're in come up most of all, so a season is possible to finish.
 */
export function missionWeight(t: { ep?: string }): number {
  const unseen = t.ep ? !S.episodesDone[t.ep] : false;
  const current = t.ep ? seasonOf(t.ep) === openSeasons() : false;
  const holdingBack = unseen && !!t.ep && seasonOf(t.ep) === waitingOn(); // the next Season is waiting on this one: bring it up even more
  return (unseen ? 4 : 1) * (current ? 3 : 1) * (holdingBack ? 3 : 1);
}

/** Depth Perception (Beatriz) is the Season 5 finale of sorts: it holds back until every other Season 5 case is done. */
export const GATED_EP = "516";
export const gatedEpReady = (): boolean => MISSIONS.every(t => !t.ep || seasonOf(t.ep) !== 5 || t.ep === GATED_EP || !!S.episodesDone[t.ep]);

export function newMission(): Mission {
  // Only seasons you've unlocked, and nothing that's already on the board or running.
  const open = MISSIONS.filter(t => missionUnlocked(t, S.life) && (!t.ep || seasonOf(t.ep) <= openSeasons()) && (t.ep !== GATED_EP || gatedEpReady()));
  // someone who's away (Nate wandered off, Fiona taken) can't help, so at most one of their cases waits on the board
  const blocked = (ally: string) => !!awayWhy(ally) && S.board.some(m => m.ally === ally);
  const fresh = open.filter(t => !S.board.some(m => m.n === t.n) && !S.active.some(m => m.n === t.n) && !blocked(t.ally));
  const t = weightedPick(fresh.length ? fresh : open.filter(x => !blocked(x.ally)).length ? open.filter(x => !blocked(x.ally)) : open, missionWeight);
  return {
    uid: S.uid++, n: t.n, dur: t.dur, succ: t.succ, heat: t.heat, rm: t.rm, fav: t.fav, ally: t.ally,
    kid: !!t.kid, elder: !!t.elder, send: false, ep: t.ep, epTitle: t.epTitle,
  };
}

export function fillBoard(): void {
  // if someone just left, keep only the first of their cases and swap the rest for something you can actually do
  const kept = new Set<string>();
  S.board = S.board.filter(m => {
    if (!awayWhy(m.ally)) return true;
    if (kept.has(m.ally)) return false;
    kept.add(m.ally);
    return true;
  });
  while (S.board.length < 3) S.board.push(newMission());
}

export function startMission(uid: number): void {
  if (inFlashback()) return; // no new cases while Sam tells his story
  const i = S.board.findIndex(m => m.uid === uid);
  if (i < 0 || !slotOpen(wouldBeHelped(S.board[i]))) return;
  if (awayWhy(S.board[i].ally)) return; // a mission built around someone can't start while they're away
  const m = S.board.splice(i, 1)[0];
  const wantsHelp = m.send || (S.auto.crew && S.cred >= 3 && !!S.allies[m.ally]); // auto-send crew
  const sent = wantsHelp && allyFree(m.ally) ? m.ally : null;
  S.active.push({ ...m, sent, left: m.dur, chance: succChance(m), reward: missionReward(m), auto: !!sent && !m.send });
  fillBoard();
  beep(400, 0.08, "triangle", 0.05);
}

const KID_LINES = [
  "Kids are the one job that never goes wrong. It's not luck; it's a rule.",
  "You don't lose when there's a kid involved. You just don't.",
];

/** Where a mission's story belongs, for the narrator: its episode, Season and name. */
const missionMeta = (m: { n: string; ep?: string; epTitle?: string }): NarrationMeta =>
  m.ep ? { label: `S${seasonOf(m.ep)} · E${episodeOf(m.ep)} · ${m.epTitle || ""}`, season: seasonOf(m.ep), name: m.n } : { name: m.n };

export function resolveMission(m: ActiveMission): void {
  const meta = missionMeta(m);
  S.active = S.active.filter(x => x.uid !== m.uid);
  if (!(S.fx.sub > 0)) S.att = Math.min(100, S.att + 8); // not while you're underwater
  if (Math.random() < m.chance) {
    const cut = m.auto ? crewCut(S.cred) : 0, paid = m.reward * (1 - cut);
    payClient(paid); S.favors += m.fav; S.heat += m.heat * heatMult(); S.stats.mDone++;
    if (m.kid) S.stats.kidMissions++;
    if (m.kid && m.sent) { S.favors += 1; say("Having the right person along made all the difference. +1 favor.", "mission", meta); }
    if (m.arc) advanceArc(m.arc.id, m.arc.step);
    if (m.ep) {
      S.episodesDone[m.ep] = true;
      const joins = ALLIES.find(a => a.gateEp && a.debutEp === m.ep && !S.allies[a.id]); // their episode opens the door to hiring them
      if (joins) { toast(`${joins.name} is in`, `${joins.name.split(" ")[0]} can now be part of your Crew.`, "story"); say(`${joins.name.split(" ")[0]} can now be part of your Crew.`, "crew"); }
    }
    reduceGrip(1);
    say(m.kid ? pick(KID_LINES) : pick(LINES.mOk), "mission", meta);
    const note = m.ep ? EP_NOTES[m.ep] : undefined;
    const won = outcomeLine(note, true, pick);
    if (won) say(won, "mission", meta);
    if (note) say("Spy tip: " + note.tip, "mission", meta);
    if (Math.random() < 0.4) say(pick(LINES.returned), "mission", meta);
    toast("Mission complete: " + m.n, `Paid ${money(paid)}${cut ? ` after your crew's ${Math.round(cut * 100)}% cut` : ""}. Expenses covered, the rest went back to the people who needed it. +${m.fav} favor`, "good");
    chime();
  } else {
    S.heat += m.heat * 1.5 * heatMult(); S.stats.mFail++;
    if (m.arc) failArcStep(m.arc.id);
    say(pick(LINES.mBad), "fail", meta);
    const lost = outcomeLine(m.ep ? EP_NOTES[m.ep] : undefined, false, pick);
    if (lost) say(lost, "fail", meta);
    toast("Mission failed: " + m.n, "Extra heat, no pay.", "bad");
    beep(130, 0.3, "sawtooth", 0.06, -50);
  }
}
