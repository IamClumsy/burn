import { S, earn } from "../state";
import { cps } from "../calc";
import { beep } from "../audio";
import { shake } from "../ui/fx";

/** Ally ability effects, keyed by ally id. */
export const ABILITIES: Record<string, () => void> = {
  sam: () => earn(cps() * 60 + 50),
  fiona: () => { earn(cps() * 120 + 100); S.heat += 15; shake(); beep(90, 0.4, "sawtooth", 0.08, -50); },
  madeline: () => { S.heat = Math.max(0, S.heat - 50); S.att = Math.max(0, S.att - 30); },
  jesse: () => { S.fx.fast = 60; },
  barry: () => { earn(cps() * 90 + 100); S.heat = Math.max(0, S.heat - 25); },
};
