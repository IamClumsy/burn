import { S } from "../state";
import { allyFree, missionReward, succChance } from "../calc";
import { ARCS } from "../data/arcs";
import { beep, chime } from "../audio";
import { say, toast } from "../ui/fx";
import { reduceGrip } from "./org";
import type { Arc, Mission } from "../types";

export const arcStep = (a: Arc): number => S.arcStep[a.id] || 0;

export const arcAvailable = (a: Arc): boolean =>
  S.life >= a.at && !S.arcsDone[a.id] && !S.active.some(m => m.arc?.id === a.id);

/** Start the next step of a case. Your ally for that case joins automatically if they're free. */
export function startArc(id: string): void {
  const a = ARCS.find(x => x.id === id);
  if (!a || !arcAvailable(a) || S.active.length >= 3) return;
  const step = arcStep(a), st = a.steps[step];
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
    toast("Case closed: " + a.title, `+${a.favors} favors. ${a.epilogue}`);
    say(a.epilogue);
  } else {
    say(`${a.title}: step ${step + 1} done. Next up: ${a.steps[step + 1].n}.`);
  }
}

export function failArcStep(id: string): void {
  const a = ARCS.find(x => x.id === id);
  if (a) say(`${a.title} isn't closed yet. That step needs another try.`);
}
