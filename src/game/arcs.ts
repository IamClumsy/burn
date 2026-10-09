import { S } from "../state";
import { allyFree, missionReward, succChance } from "../calc";
import { ARCS } from "../data/arcs";
import { seasonsOpen } from "../data/missions";
import { beep, chime } from "../audio";
import { say as sayTag, toast } from "../ui/fx";
import { reduceGrip } from "./org";
import type { Arc, Mission } from "../types";
import { BOWLING, SAM_ACTS, SAM_BEATS, SAM_ARC, SAM_ARC_ID } from "../data/samAxe";
import { choiceBusy, showChoice } from "../ui/choice";
import { startFlashbackBoss } from "./bosses";
const say = (t: string): void => sayTag(t, "mission");

export const arcStep = (a: Arc): number => S.arcStep[a.id] || 0;

export const arcAvailable = (a: Arc): boolean =>
  S.life >= a.at && !S.arcsDone[a.id] && !S.active.some(m => m.arc?.id === a.id) &&
  (!a.needsEp || !!S.episodesDone[a.needsEp] || seasonsOpen(S.life) >= (a.orSeason ?? 99) || (a.id === SAM_ARC_ID && S.samOffered));

/** Settings button for players who are already past Season 5: Sam tells the story whenever you ask. */
export function askSamForStory(): void {
  if (S.arcsDone[SAM_ARC_ID] || S.samOffered || arcAvailable(SAM_ARC)) return;
  S.samOffered = true;
  toast("Sam has a story", "\"Colombia, 2005,\" says Sam, and orders a drink. \"Pull up a chair.\" The Fall of Sam Axe is now an Open Case.", "story");
  say("You asked, so Sam clears his throat. This is going to take a while.");
}

/** Before Act One: remember the bowling alley (Michael's cameo) for a small boost to the first step. Once per case. */
export function rememberBowling(): void {
  if (!arcAvailable(SAM_ARC) || arcStep(SAM_ARC) !== 0 || S.samChoices.bowling) return;
  S.samChoices.bowling = 1;
  toast(BOWLING.title, BOWLING.text, "story");
  say(BOWLING.say);
}

/** Start the next step of a case. Your ally for that case joins automatically if they're free. */
export function startArc(id: string): void {
  const a = ARCS.find(x => x.id === id);
  if (!a || !arcAvailable(a) || S.active.length >= 3) return;
  const step = arcStep(a), st = a.steps[step];
  // The Fall of Sam Axe: each act opens with the Admiral's questions and a choice about how Sam tells it.
  if (id === SAM_ARC_ID && st.act !== undefined && S.samChoices[st.act] === undefined) {
    if (choiceBusy()) return; // one decision at a time
    const act = SAM_ACTS[st.act];
    showChoice(`The Fall of Sam Axe · ${act.title}`, `${act.inquiry} ${act.prompt}`, act.options.map((o, k): [string, () => string] => [o.label, () => {
      S.samChoices[st.act!] = k;
      if (o.fx.favors) S.favors += o.fx.favors;
      return o.result;
    }]), () => launchStep(a, step), { inquiry: true });
    return;
  }
  // The steps between acts get the Admiral cutting in too, once each, with nothing to decide.
  if (id === SAM_ARC_ID && SAM_BEATS[step] && !S.samChoices["beat" + step]) {
    if (choiceBusy()) return;
    const beat = SAM_BEATS[step];
    showChoice(`The Fall of Sam Axe · ${beat.title}`, beat.inquiry, [[beat.go, () => { S.samChoices["beat" + step] = 1; return "Sam carries on."; }]], () => launchStep(a, step), { inquiry: true });
    return;
  }
  launchStep(a, step);
}

function launchStep(a: Arc, step: number): void {
  const st = a.steps[step];
  if (S.active.length >= 3 || arcAvailable(a) === false) return;
  if (st.boss) { // a showdown instead of a mission
    if (S.boss) { say("Finish the case you're on first. The road will still be there."); return; }
    startFlashbackBoss(st.boss, a.id, step);
    return;
  }
  const base: Mission = {
    uid: S.uid++, n: `${a.title}: ${st.n}`, dur: st.dur, succ: st.succ, heat: st.heat, rm: st.rm, fav: 1,
    ally: a.ally, kid: false, send: allyFree(a.ally), arc: { id: a.id, step },
  };
  const sent = base.send ? a.ally : null;
  S.active.push({ ...base, sent, left: st.dur, chance: succChance(base), reward: missionReward(base) });
  beep(400, 0.08, "triangle", 0.05);
}

/** A step succeeded: move the case forward, or close it. */
export function advanceArc(id: string, step: number): void {
  const a = ARCS.find(x => x.id === id);
  if (!a) return;
  S.arcStep[id] = step + 1;
  if (step + 1 >= a.steps.length) {
    S.arcsDone[id] = true;
    S.favors += a.favors;
    reduceGrip(8);
    chime();
    toast("Case closed: " + a.title, `+${a.favors} favors. ${a.epilogue}`, "good");
    sayTag(a.epilogue, "mission", { label: `Case closed · ${a.title}`, name: a.title });
  } else {
    sayTag(`${a.title}: step ${step + 1} done. Next up: ${a.steps[step + 1].n}.`, "mission", { label: `Open case · ${a.title}`, name: a.title });
  }
}

export function failArcStep(id: string): void {
  const a = ARCS.find(x => x.id === id);
  if (a) say(`${a.title} isn't closed yet. That step needs another try.`);
}
