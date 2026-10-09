import { S } from "../state";
import { seasonOf } from "../data/missions";
import { allyFree, missionReward, openSeasons, slotOpen, succChance } from "../calc";
import { ARCS } from "../data/arcs";
import { beep, chime } from "../audio";
import { say as sayTag, toast } from "../ui/fx";
import { reduceGrip } from "./org";
import type { Arc, Mission } from "../types";
import { BOWLING, SAM_ACTS, SAM_BEATS, SAM_BRIDGE, SAM_ARC, SAM_ARC_ID } from "../data/samAxe";
import { choiceBusy, showChoice } from "../ui/choice";
import { dropNotice } from "../ui/notice";
import { startFlashbackBoss } from "./bosses";
const say = (t: string): void => sayTag(t, "mission");

/** How long a step takes. Sam's story runs at double speed: everything else is paused while he tells it. */
export const stepDur = (a: Arc, dur: number): number => a.id === SAM_ARC_ID ? Math.round(dur / 2) : dur;

export const arcStep = (a: Arc): number => S.arcStep[a.id] || 0;

export const arcAvailable = (a: Arc): boolean =>
  S.life >= a.at && (!S.seasonGate || !a.ep || openSeasons() >= seasonOf(a.ep)) && (!S.arcsDone[a.id] || (a.id === SAM_ARC_ID && S.samReplay)) && !S.active.some(m => m.arc?.id === a.id) &&
  (!a.needsEp || !!S.episodesDone[a.needsEp] || openSeasons() >= (a.orSeason ?? 99));

/** Hear it again from the menu once it's been told: the case starts over, with new answers and no second helping of rewards. */
export function replaySamStory(): void {
  if (!S.arcsDone[SAM_ARC_ID] || S.samReplay || S.boss || S.active.length) return;
  S.samReplay = true;
  S.arcStep[SAM_ARC_ID] = 0;
  S.samChoices = {};
  toast("Sam tells it again", "\"Colombia, 2005,\" says Sam, and orders a drink. Everything else waits until he's done. The Fall of Sam Axe is an Open Case again, and this time you can answer the Admiral differently. The favors and prizes were yours the first time.", "story");
  say("Sam clears his throat. He's been waiting for someone to ask.");
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
  if (!a || !arcAvailable(a) || !slotOpen(allyFree(a.ally))) return;
  const step = arcStep(a), st = a.steps[step];
  // The Fall of Sam Axe: each act opens with the Admiral's questions and a choice about how Sam tells it.
  if (id === SAM_ARC_ID && st.act !== undefined && S.samChoices[st.act] === undefined) {
    if (choiceBusy()) return; // one decision at a time
    const act = SAM_ACTS[st.act];
    showChoice(`The Fall of Sam Axe · ${act.title}`, `${act.inquiry} ${act.prompt}`, act.options.map((o, k): [string, () => string] => [o.label, () => {
      S.samChoices[st.act!] = k;
      if (o.fx.favors && !S.samReplay) S.favors += o.fx.favors;
      return o.result;
    }]), res => launchStep(a, step, res, `The Fall of Sam Axe · ${act.title}`), { inquiry: true });
    return;
  }
  // The steps between acts get the Admiral cutting in too, once each, with nothing to decide.
  if (id === SAM_ARC_ID && SAM_BEATS[step] && !S.samChoices["beat" + step]) {
    if (choiceBusy()) return;
    const beat = SAM_BEATS[step];
    showChoice(`The Fall of Sam Axe · ${beat.title}`, `${beat.inquiry} ${beat.prompt}`, beat.options.map((o, k): [string, () => string] => [o.label, () => {
      S.samChoices["beat" + step] = k + 1; // 0 would read as "not told yet"
      return o.result;
    }]), () => launchStep(a, step), { inquiry: true });
    return;
  }
  launchStep(a, step);
}

function launchStep(a: Arc, step: number, prior?: string, priorTitle?: string): void {
  const st = a.steps[step];
  if (!slotOpen(allyFree(a.ally)) || arcAvailable(a) === false) return;
  if (st.boss) { // a showdown instead of a mission
    if (S.boss) { say("Finish the case you're on first. The road will still be there."); return; }
    if (a.id === SAM_ARC_ID && !S.samChoices.bridge && prior !== undefined) { // a beat between the last answer and the fight
      if (priorTitle) dropNotice(priorTitle); // its result is in this scene, so it needn't pop up again
      showChoice(`The Fall of Sam Axe · ${SAM_BRIDGE.title}`, `${prior}\n\n${SAM_BRIDGE.scene}`, [[SAM_BRIDGE.go, () => { S.samChoices.bridge = 1; return "Sam holds the road."; }]],
        () => launchStep(a, step), { inquiry: true });
      return;
    }
    startFlashbackBoss(st.boss, a.id, step);
    return;
  }
  const base: Mission = {
    uid: S.uid++, n: `${a.title}: ${st.n}`, dur: stepDur(a, st.dur), succ: st.succ, heat: st.heat, rm: st.rm, fav: a.id === SAM_ARC_ID && S.samReplay ? 0 : 1,
    ally: a.ally, kid: false, send: allyFree(a.ally), arc: { id: a.id, step },
  };
  const sent = base.send ? a.ally : null;
  S.active.push({ ...base, sent, left: base.dur, chance: succChance(base), reward: missionReward(base) });
  beep(400, 0.08, "triangle", 0.05);
}

/** A step succeeded: move the case forward, or close it. */
export function advanceArc(id: string, step: number): void {
  const a = ARCS.find(x => x.id === id);
  if (!a) return;
  S.arcStep[id] = step + 1;
  if (step + 1 >= a.steps.length) {
    if (a.ep) S.episodesDone[a.ep] = true; // closing the case counts as seeing its episode
    const again = id === SAM_ARC_ID && S.samReplay; // told a second time: no more favors or grip
    S.arcsDone[id] = true; S.samReplay = again ? false : S.samReplay;
    if (!again) { S.favors += a.favors; reduceGrip(8); }
    chime();
    toast("Case closed: " + a.title, `${again ? "Told again." : `+${a.favors} favors.`} ${a.epilogue}`, "good");
    sayTag(a.epilogue, "mission", { label: `Case closed · ${a.title}`, name: a.title });
  } else {
    sayTag(`${a.title}: step ${step + 1} done. Next up: ${a.steps[step + 1].n}.`, "mission", { label: `Open case · ${a.title}`, name: a.title });
  }
}

export function failArcStep(id: string): void {
  const a = ARCS.find(x => x.id === id);
  if (a) say(`${a.title} isn't closed yet. That step needs another try.`);
}
