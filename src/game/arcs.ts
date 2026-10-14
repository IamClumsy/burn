import { S } from "../state";
import { seasonOf } from "../data/missions";
import { allyFree, finaleHeldBack, missionReward, openSeasons, slotOpen, succChance } from "../calc";
import { ARCS } from "../data/arcs";
import { beep, chime } from "../audio";
import { say as sayTag, toast } from "../ui/fx";
import { reduceGrip } from "./org";
import type { Arc, Mission } from "../types";
import { flashbackById } from "../data/flashbacks";
import { fbState } from "../flashbackState";
import { choiceBusy, showChoice } from "../ui/choice";
import { dropNotice } from "../ui/notice";
import { startFlashbackBoss } from "./bosses";
const say = (t: string): void => sayTag(t, "mission");

/** How long a step takes. A flashback runs faster, because everything else is paused while it's told. */
export const stepDur = (a: Arc, dur: number): number => {
  const f = flashbackById(a.id);
  return f ? Math.round(dur * f.speed) : dur;
};

export const arcStep = (a: Arc): number => S.arcStep[a.id] || 0;

export const arcAvailable = (a: Arc): boolean => {
  const replaying = !!flashbackById(a.id) && fbState(a.id).replay;
  return S.life >= a.at && (!a.ep || openSeasons() >= seasonOf(a.ep)) && (!a.ep || !finaleHeldBack(a.ep)) && (!S.arcsDone[a.id] || replaying) && !S.active.some(m => m.arc?.id === a.id) &&
    (!a.needsEp || !!S.episodesDone[a.needsEp] || openSeasons() >= (a.orSeason ?? 99));
};

/** Hear a flashback again from the menu once it's been told: the case starts over, with new answers and no second helping of rewards. */
export function replayFlashback(id: string): void {
  const f = flashbackById(id);
  if (!f || !S.arcsDone[id] || fbState(id).replay || S.boss || S.active.length) return;
  const st = fbState(id);
  st.replay = true;
  S.arcStep[id] = 0;
  st.choices = {};
  toast(f.replay.title, f.replay.text, "story");
  say(f.replay.say);
}
export const replaySamStory = (): void => replayFlashback("samfall");

/** The once-only nod before step one (for Sam's story, the bowling alley): a small boost to the first step. */
export function rememberNod(id: string): void {
  const f = flashbackById(id);
  if (!f?.nod || !arcAvailable(f.arc) || arcStep(f.arc) !== 0 || fbState(id).choices.nod) return;
  fbState(id).choices.nod = 1;
  toast(f.nod.title, f.nod.text, "story");
  say(f.nod.say);
}
export const rememberBowling = (): void => rememberNod("samfall");

/** Start the next step of a case. Your ally for that case joins automatically if they're free. */
export function startArc(id: string): void {
  const a = ARCS.find(x => x.id === id);
  if (!a || !arcAvailable(a) || !slotOpen(allyFree(a.ally))) return;
  const step = arcStep(a), st = a.steps[step];
  const f = flashbackById(id);
  if (f) {
    const fb = fbState(id);
    // each act opens with a question and a choice about how it's told
    if (st.act !== undefined && fb.choices[st.act] === undefined) {
      if (choiceBusy()) return; // one decision at a time
      const act = f.acts[st.act], title = `${f.title} · ${act.title}`;
      showChoice(title, `${act.inquiry} ${act.prompt}`, act.options.map((o, k): [string, () => string] => [o.label, () => {
        fb.choices[st.act!] = k;
        if (o.fx.favors && !fb.replay) S.favors += o.fx.favors;
        return o.result;
      }]), res => launchStep(a, step, res, title), { inquiry: true });
      return;
    }
    // the steps between acts get a card too, once each
    if (f.beats[step] && !fb.choices["beat" + step]) {
      if (choiceBusy()) return;
      const beat = f.beats[step];
      showChoice(`${f.title} · ${beat.title}`, `${beat.inquiry} ${beat.prompt}`, beat.options.map((o, k): [string, () => string] => [o.label, () => {
        fb.choices["beat" + step] = k + 1; // 0 would read as "not told yet"
        return o.result;
      }]), () => launchStep(a, step), { inquiry: true });
      return;
    }
  }
  launchStep(a, step);
}

function launchStep(a: Arc, step: number, prior?: string, priorTitle?: string): void {
  const st = a.steps[step];
  if (!slotOpen(allyFree(a.ally)) || arcAvailable(a) === false) return;
  const f = flashbackById(a.id);
  if (st.boss) { // a showdown instead of a mission
    if (S.boss) { say("Finish the case you're on first. The road will still be there."); return; }
    if (f?.bridge && !fbState(a.id).choices.bridge && prior !== undefined) { // a beat between the last answer and the fight
      if (priorTitle) dropNotice(priorTitle); // its result is in this scene, so it needn't pop up again
      const b = f.bridge;
      showChoice(`${f.title} · ${b.title}`, `${prior}\n\n${b.scene}`, [[b.go, () => { fbState(a.id).choices.bridge = 1; return b.result; }]],
        () => launchStep(a, step), { inquiry: true });
      return;
    }
    startFlashbackBoss(st.boss, a.id, step);
    return;
  }
  const replaying = !!f && fbState(a.id).replay;
  const base: Mission = {
    uid: S.uid++, n: `${a.title}: ${st.n}`, dur: stepDur(a, st.dur), succ: st.succ, heat: st.heat, rm: st.rm, fav: replaying ? 0 : 1,
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
    const fb = flashbackById(id) ? fbState(id) : null;
    const again = !!fb && fb.replay; // told a second time: no more favors or grip
    S.arcsDone[id] = true;
    if (fb && again) fb.replay = false;
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
  if (!a) return;
  say(`${a.title} isn't closed yet. That step needs another try.`);
  const f = flashbackById(id);
  if (f) { // in a flashback a repeat is a repeat: the listener wants that part again
    const r = f.retry(a.steps[arcStep(a)].n);
    toast(r.title, r.text, "bad");
  }
}
